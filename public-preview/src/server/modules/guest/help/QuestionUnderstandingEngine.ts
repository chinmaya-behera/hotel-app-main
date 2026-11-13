/**
 * Question Understanding & Resolution Engine (GUEST-HELP-02 Phase 5)
 *
 * Implements a layered understanding architecture:
 * - Layer 1: Deterministic phrase and keyword scoring
 * - Layer 2: Typo-tolerant and fuzzy distance matching
 * - Layer 3: Grounded AI/RAG engine interface (`IAssistantEngine`) with zero hallucination
 *
 * Enforces route allowlist validation to prevent navigation to arbitrary URLs.
 */

import { BotMessageService } from './BotMessageConfig.ts';
import {
  HotelKnowledgeBase,
  type HotelKnowledgeEntry,
  type KnowledgeCategory,
  type VerifiedPortalAction,
  isRouteAllowed,
} from './HotelKnowledgeBase.ts';

export interface QuestionContext {
  guestName?: string;
  room?: string;
  currentNodeId?: string;
}

export interface QuestionResolution {
  isResolved: boolean;
  confidence: 'high' | 'medium' | 'low';
  matchedTopic?: string;
  category?: KnowledgeCategory | 'out_of_scope' | 'unconfigured';
  answer: string;
  knowledgeEntryId?: string;
  flowNodeId?: string;
  suggestedAction?: VerifiedPortalAction;
  suggestedFollowUps?: string[];
  source?: string;
  originalQuery: string;
}

export interface IAssistantEngine {
  processQuestion(query: string, context?: QuestionContext): Promise<QuestionResolution>;
  processQuestionSync?(query: string, context?: QuestionContext): QuestionResolution;
}

/**
 * Standard Levenshtein Distance for Typo & Fuzzy Matching
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], prev, row[j]) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }

  return row[b.length];
}

/**
 * Normalizes user text and maps common phonetic typos / slang to canonical hotel terms
 */
const CANONICAL_TYPO_MAP: Record<string, string> = {
  'checout': 'checkout',
  'chekout': 'checkout',
  'chekot': 'checkout',
  'chkout': 'checkout',
  'towelz': 'towel',
  'towls': 'towel',
  'towells': 'towel',
  'towl': 'towel',
  'a/c': 'ac',
  'aircon': 'ac',
  'aircond': 'ac',
  'restarant': 'restaurant',
  'resturant': 'restaurant',
  'restraunt': 'restaurant',
  'restaraunt': 'restaurant',
  'brakfast': 'breakfast',
  'brekfast': 'breakfast',
  'breakfst': 'breakfast',
  'bfast': 'breakfast',
  'houskeeping': 'housekeeping',
  'housekiping': 'housekeeping',
  'hosekeeping': 'housekeeping',
  'clen': 'clean',
  'cleen': 'clean',
  'recption': 'reception',
  'receptn': 'reception',
  'frnt': 'front',
  'frontdesk': 'front desk',
  'swiming': 'swimming',
  'swimmimg': 'swimming',
  'pol': 'pool',
  'massge': 'massage',
  'masage': 'massage',
  'mesage': 'massage',
  'intenet': 'internet',
  'wifii': 'wifi',
  'passwrd': 'password',
  'pasword': 'password',
  'pluming': 'plumbing',
  'leek': 'leak',
  'leakg': 'leak',
  'biling': 'billing',
  'folo': 'folio',
  'invois': 'invoice',
  'dnd': 'dnd',
  'distrb': 'disturb',
};

/**
 * Out-of-scope keyword patterns that must trigger the out-of-scope response
 */
const OUT_OF_SCOPE_PATTERNS = [
  'stock market',
  'crypto',
  'bitcoin',
  'ethereum',
  'political party',
  'who is the president',
  'write python code',
  'solve math equation',
  'homework',
  'recipe for cake at home',
  'flight booking to new york',
  'movie ticket booking',
  'tell me a joke',
  'chatgpt',
];

/**
 * Unconfigured hotel amenities (explicitly in hotel context but not offered or unconfigured)
 */
const UNCONFIGURED_AMENITIES_PATTERNS = [
  'casino',
  'slot machine',
  'gambling',
  'helicopter',
  'helipad',
  'private jet',
  'water slide',
  'scuba diving',
  'bungee jumping',
  'child daycare',
  'babysitting service',
];

const ENTRY_TO_FLOW_NODE: Record<string, string> = {
  kb_maint_ac: 'node_maint_ac',
  kb_maint_plumbing_electric: 'node_maint_plumb',
  kb_maint_tv: 'node_maint_tv',
  kb_hk_towels_linens: 'node_hk_towels',
  kb_hk_cleaning: 'node_hk_cleaning',
  kb_hk_toiletries: 'node_hk_toiletries',
  kb_dining_restaurants: 'node_dining_root',
  kb_dining_breakfast: 'node_dining_breakfast',
  kb_food_order_guide: 'node_dining_menu',
  kb_food_dietary: 'node_dining_dietary',
  kb_wellness_spa: 'node_spa_treatments',
  kb_fac_pool: 'node_spa_pool',
  kb_fac_wifi: 'node_stay_wifi',
  kb_stay_dnd: 'node_stay_dnd',
  kb_stay_room_details: 'node_stay_summary',
  kb_checkin_checkout: 'node_stay_checkout',
  kb_express_checkout: 'node_folio_express',
  kb_billing_folio: 'node_folio_charges',
  kb_portal_activity: 'node_portal_activity',
  kb_portal_tour: 'node_portal_tour',
  kb_fd_contact: 'node_fd_message',
  kb_service_luggage: 'node_fd_concierge',
  kb_service_wakeup: 'node_fd_message',
  kb_service_lost_found: 'node_fd_message',
};

const CATEGORY_TO_TOPIC_ID: Record<string, string> = {
  maintenance: 'maintenance',
  housekeeping: 'housekeeping',
  dining: 'dining',
  food_ordering: 'dining',
  wellness: 'wellness',
  facilities: 'wellness',
  stay_info: 'stay_info',
  hotel_overview: 'stay_info',
  checkin_checkout: 'stay_info',
  policies: 'stay_info',
  billing: 'billing_checkout',
  portal_guide: 'portal_help',
  front_desk: 'front_desk',
  other_services: 'front_desk',
};

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'about',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'you', 'your', 'yours',
  'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their',
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
  'am', 'have', 'has', 'had', 'do', 'does', 'did', 'doing',
  'would', 'should', 'could', 'ought', 'can', 'may', 'might', 'must',
  'where', 'how', 'when', 'why', 'and', 'but', 'if', 'or', 'because',
  'as', 'until', 'while', 'so', 'than', 'too', 'very', 's', 't', 'just',
  'don', 'now', 'please', 'tell', 'want', 'need', 'get', 'give'
]);

export class LocalGroundedEngine implements IAssistantEngine {
  /**
   * Async entry point satisfying IAssistantEngine interface
   */
  public async processQuestion(query: string, context?: QuestionContext): Promise<QuestionResolution> {
    return this.processQuestionSync(query, context);
  }

  /**
   * Synchronous resolution pipeline for high-performance in-memory lookups
   */
  public processQuestionSync(query: string, _context?: QuestionContext): QuestionResolution {
    const rawQuery = (query || '').trim();
    const config = BotMessageService.getConfig();

    // 1. Empty / Whitespace query check
    if (!rawQuery) {
      return {
        isResolved: false,
        confidence: 'low',
        category: 'unconfigured',
        answer: config.errorMessages.emptyQuestion,
        originalQuery: rawQuery,
      };
    }

    // 2. Length check
    if (rawQuery.length > 500) {
      return {
        isResolved: false,
        confidence: 'low',
        category: 'unconfigured',
        answer: config.errorMessages.questionTooLong,
        originalQuery: rawQuery,
      };
    }

    const normalized = rawQuery.toLowerCase();

    // 3. Out-of-scope filter
    for (const pattern of OUT_OF_SCOPE_PATTERNS) {
      if (normalized.includes(pattern)) {
        return {
          isResolved: false,
          confidence: 'low',
          category: 'out_of_scope',
          answer: config.outOfScopeMessage,
          flowNodeId: 'node_fallback',
          suggestedAction: {
            label: config.actionButtonLabels.frontDesk,
            targetTab: 'services',
            targetSubtab: 'front_desk',
          },
          suggestedFollowUps: [
            'What facilities are in this hotel?',
            'What time is breakfast?',
            'How do I contact Front Desk?',
          ],
          originalQuery: rawQuery,
        };
      }
    }

    // 4. Unconfigured amenities filter
    for (const amenity of UNCONFIGURED_AMENITIES_PATTERNS) {
      if (normalized.includes(amenity)) {
        return {
          isResolved: false,
          confidence: 'low',
          category: 'unconfigured',
          answer: `Our hotel currently does not have a configured ${amenity} facility on property. For inquiries about nearby partners or arrangements, please speak with our Front Desk.`,
          flowNodeId: 'node_fallback',
          suggestedAction: {
            label: config.actionButtonLabels.frontDesk,
            targetTab: 'services',
            targetSubtab: 'front_desk',
          },
          suggestedFollowUps: [
            'What facilities are available?',
            'Explore Spa & Wellness',
            'View Dining Options',
          ],
          originalQuery: rawQuery,
        };
      }
    }

    // 5. Pre-process query: map typos and tokenize
    const cleanTokens = normalized
      .replace(/[^a-z0-9\s/]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);

    const expandedTokens = cleanTokens.map((tok) => CANONICAL_TYPO_MAP[tok] || tok);
    const preprocessedQuery = expandedTokens.join(' ');

    // 6. Layer 1 & 2 Scoring against Hotel Knowledge Base
    const entries = HotelKnowledgeBase.getAllEntries();
    let bestEntry: HotelKnowledgeEntry | null = null;
    let highestScore = 0;

    for (const entry of entries) {
      let score = 0;

      // 6a. Match against entry aliases (exact or high-overlap questions)
      for (const alias of entry.aliases) {
        const aliasLower = alias.toLowerCase();
        if (preprocessedQuery.includes(aliasLower) || normalized.includes(aliasLower)) {
          score += 90;
        } else {
          // Token overlap check (ignoring stopwords)
          const aliasTokens = aliasLower.split(/\s+/).filter((t) => !STOP_WORDS.has(t));
          const common = aliasTokens.filter((t) => expandedTokens.includes(t));
          if (common.length >= 2) {
            score += 45 + common.length * 20;
          } else if (common.length === 1 && aliasTokens.length === 1) {
            score += 40;
          }
        }
      }

      // 6b. Match against entry keywords & phrases
      for (const kw of entry.keywords) {
        const kwLower = kw.toLowerCase().trim();
        if (!kwLower) continue;

        if (kwLower.includes(' ')) {
          // Multi-word phrase check (e.g. "air conditioning", "room service", "quiet hours")
          if (preprocessedQuery.includes(kwLower) || normalized.includes(kwLower)) {
            score += 70 + kwLower.length * 2;
          }
        } else {
          // Single word match in preprocessed query
          if (expandedTokens.includes(kwLower)) {
            score += 35 + kwLower.length * 2;
          } else {
            // Layer 2: Fuzzy distance match on tokens
            for (const token of cleanTokens) {
              if (token.length >= 4 && kwLower.length >= 4) {
                const dist = levenshteinDistance(token, kwLower);
                if (dist === 1) {
                  score += 25; // 1-character typo match
                } else if (dist === 2 && token.length >= 6 && kwLower.length >= 6) {
                  score += 15; // 2-character typo match for longer words
                }
              }
            }
          }
        }
      }

      // 6c. Match against entry title / topic
      const titleLower = entry.title.toLowerCase();
      if (preprocessedQuery.includes(titleLower)) {
        score += 50;
      }

      if (score > highestScore) {
        highestScore = score;
        bestEntry = entry;
      }
    }

    // 7. Threshold evaluation
    if (bestEntry && highestScore >= 30) {
      // Validate action against route allowlist
      let validatedAction: VerifiedPortalAction | undefined = undefined;
      if (bestEntry.suggestedAction) {
        if (isRouteAllowed(bestEntry.suggestedAction.targetTab, bestEntry.suggestedAction.targetSubtab)) {
          validatedAction = bestEntry.suggestedAction;
        } else {
          // If action was invalid or arbitrary, fall back to safe Front Desk action
          validatedAction = {
            label: config.actionButtonLabels.frontDesk,
            targetTab: 'services',
            targetSubtab: 'front_desk',
          };
        }
      }

      // Resolve flowNodeId if electrical vs plumbing in kb_maint_plumbing_electric
      let targetNodeId = ENTRY_TO_FLOW_NODE[bestEntry.id] || 'node_root';
      if (bestEntry.id === 'kb_maint_plumbing_electric') {
        if (normalized.includes('light') || normalized.includes('bulb') || normalized.includes('electric') || normalized.includes('socket') || normalized.includes('power')) {
          targetNodeId = 'node_maint_elec';
        } else {
          targetNodeId = 'node_maint_plumb';
        }
      }

      const mappedTopic = CATEGORY_TO_TOPIC_ID[bestEntry.category] || bestEntry.category;

      return {
        isResolved: true,
        confidence: highestScore >= 60 ? 'high' : 'medium',
        matchedTopic: mappedTopic,
        category: bestEntry.category,
        answer: bestEntry.answer,
        knowledgeEntryId: bestEntry.id,
        flowNodeId: targetNodeId,
        suggestedAction: validatedAction,
        suggestedFollowUps: bestEntry.suggestedFollowUps,
        source: bestEntry.source,
        originalQuery: rawQuery,
      };
    }

    // 8. Safe Grounded Fallback
    const fallbackAnswer = `I couldn't find an exact match for "${rawQuery}". Our 24/7 Front Desk team is ready to assist you right away, or you can explore our service categories below.`;

    return {
      isResolved: false,
      confidence: 'low',
      category: 'unconfigured',
      answer: fallbackAnswer,
      flowNodeId: 'node_fallback',
      suggestedAction: {
        label: config.actionButtonLabels.frontDesk,
        targetTab: 'services',
        targetSubtab: 'front_desk',
      },
      suggestedFollowUps: [
        'How can I report an AC problem?',
        'Where can I order food?',
        'What time is checkout?',
        'How do I request fresh towels?',
      ],
      originalQuery: rawQuery,
    };
  }
}

/**
 * Singleton factory returning active assistant engine
 */
export class AssistantEngineProvider {
  private static instance: IAssistantEngine = new LocalGroundedEngine();

  public static getEngine(): IAssistantEngine {
    return this.instance;
  }

  public static setEngine(customEngine: IAssistantEngine): void {
    this.instance = customEngine;
  }

  public static resetToDefault(): void {
    this.instance = new LocalGroundedEngine();
  }
}
