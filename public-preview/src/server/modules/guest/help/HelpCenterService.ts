import crypto from 'node:crypto';
import {
  HELP_TOPICS,
  FLOW_NODES,
  KEYWORD_RULES,
  type HelpTopic,
  type HelpFlowNode,
  type HelpPortalAction,
  type HelpFeedbackRecord,
} from './HelpCenterData.ts';

export interface ResolveQuestionResult {
  isResolved: boolean;
  confidence: 'high' | 'medium' | 'low';
  matchedTopic?: string;
  node: HelpFlowNode;
  suggestedAction?: HelpPortalAction;
  originalQuery: string;
}

export interface FeedbackSubmissionInput {
  flowId?: string;
  query?: string;
  helpful: boolean;
  comment?: string;
}

export class HelpCenterService {
  private static feedbackStorage: HelpFeedbackRecord[] = [];

  /**
   * Retrieves all 8 available help categories
   */
  public getTopics(): HelpTopic[] {
    return HELP_TOPICS;
  }

  /**
   * Retrieves a specific flow node by ID (or root node if invalid)
   */
  public getFlowNode(nodeId?: string): HelpFlowNode {
    if (!nodeId || !FLOW_NODES[nodeId]) {
      return FLOW_NODES['node_root'];
    }
    return FLOW_NODES[nodeId];
  }

  /**
   * Resolves a free-text question using keyword & alias scoring
   */
  public resolveQuestion(query: string, _currentNodeId?: string): ResolveQuestionResult {
    const rawQuery = (query || '').trim();
    const normalized = rawQuery.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');

    let bestRule = null;
    let highestScore = 0;

    for (const rule of KEYWORD_RULES) {
      for (const kw of rule.keywords) {
        const kwLower = kw.toLowerCase().trim();
        if (!kwLower) continue;

        // 1. Phrase match (multiple words, e.g. "air conditioning", "room service")
        if (kwLower.includes(' ')) {
          if (normalized.includes(kwLower)) {
            const score = 80 + kwLower.length * 3;
            if (score > highestScore) {
              highestScore = score;
              bestRule = rule;
            }
          }
        } else {
          // 2. Single word match
          // Whole word boundary match (always preferred)
          const wordRegex = new RegExp(`\\b${kwLower.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
          if (wordRegex.test(normalized)) {
            const score = 50 + kwLower.length * 2;
            if (score > highestScore) {
              highestScore = score;
              bestRule = rule;
            }
          } else if (kwLower.length >= 4) {
            // Prefix match for words 4+ chars long (e.g. "plumb" matching "plumbing", "towel" matching "towels")
            const prefixRegex = new RegExp(`\\b${kwLower.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}`, 'i');
            if (prefixRegex.test(normalized)) {
              const score = 30 + kwLower.length * 2;
              if (score > highestScore) {
                highestScore = score;
                bestRule = rule;
              }
            }
          }
        }
      }
    }

    if (bestRule && highestScore >= 20) {
      const node = FLOW_NODES[bestRule.nodeId] || FLOW_NODES['node_root'];
      return {
        isResolved: true,
        confidence: highestScore >= 50 ? 'high' : 'medium',
        matchedTopic: bestRule.topicId,
        node,
        suggestedAction: bestRule.suggestedAction || node.action,
        originalQuery: rawQuery,
      };
    }

    // Fallback node when no direct rule matched
    const fallbackNode: HelpFlowNode = {
      id: 'node_fallback',
      topicId: 'front_desk',
      title: 'How can we help?',
      message: `I couldn't find an exact match for "${rawQuery}". Our 24/7 Front Desk team is ready to assist you right away, or you can explore our service categories below.`,
      choices: HELP_TOPICS.slice(0, 4).map((t) => ({
        id: t.id,
        label: t.title,
        description: t.description,
        nextNodeId: t.rootNodeId,
        icon: t.icon,
      })),
      action: {
        label: 'Message Front Desk Directly',
        targetTab: 'services',
        targetSubtab: 'front_desk',
      },
      canGoBack: true,
      parentNodeId: 'node_root',
    };

    return {
      isResolved: false,
      confidence: 'low',
      node: fallbackNode,
      suggestedAction: fallbackNode.action,
      originalQuery: rawQuery,
    };
  }

  /**
   * Records helpfulness rating and feedback
   */
  public submitFeedback(input: FeedbackSubmissionInput): { success: boolean; id: string; message: string } {
    const id = `fb_${crypto.randomUUID()}`;
    const record: HelpFeedbackRecord = {
      id,
      flowId: input.flowId,
      query: input.query,
      helpful: Boolean(input.helpful),
      comment: input.comment ? input.comment.trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    HelpCenterService.feedbackStorage.push(record);

    return {
      success: true,
      id,
      message: 'Thank you for your feedback! We are always working to make your stay extraordinary.',
    };
  }

  /**
   * Retrieves all recorded feedback (for testing/admin review)
   */
  public getFeedbackRecords(): HelpFeedbackRecord[] {
    return [...HelpCenterService.feedbackStorage];
  }

  /**
   * Clears feedback storage for clean unit testing
   */
  public static clearTestData(): void {
    HelpCenterService.feedbackStorage = [];
  }
}
