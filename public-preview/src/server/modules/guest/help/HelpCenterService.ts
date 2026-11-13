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
import { BotMessageService, type BotMessageConfiguration } from './BotMessageConfig.ts';
import { HotelKnowledgeBase, type HotelKnowledgeEntry } from './HotelKnowledgeBase.ts';
import {
  LocalGroundedEngine,
  AssistantEngineProvider,
  type QuestionResolution,
} from './QuestionUnderstandingEngine.ts';

export interface ResolveQuestionResult {
  isResolved: boolean;
  confidence: 'high' | 'medium' | 'low';
  matchedTopic?: string;
  category?: string;
  node: HelpFlowNode;
  suggestedAction?: HelpPortalAction;
  suggestedFollowUps?: string[];
  knowledgeEntryId?: string;
  source?: string;
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
  private engine = new LocalGroundedEngine();

  /**
   * Retrieves all 8 available help categories
   */
  public getTopics(): HelpTopic[] {
    return HELP_TOPICS;
  }

  /**
   * Retrieves centralized bot message configuration
   */
  public getBotConfig(): BotMessageConfiguration {
    return BotMessageService.getConfig();
  }

  /**
   * Updates centralized bot messages
   */
  public updateBotConfig(overrides: Partial<BotMessageConfiguration>): BotMessageConfiguration {
    return BotMessageService.updateConfig(overrides);
  }

  /**
   * Retrieves knowledge base entries
   */
  public getKnowledgeEntries(): HotelKnowledgeEntry[] {
    return HotelKnowledgeBase.getAllEntries();
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
   * Resolves a free-text question using layered understanding:
   * Layer 1: Keyword/phrase scoring
   * Layer 2: Typo and fuzzy distance matching
   * Layer 3: Grounded Hotel Knowledge Base retrieval
   */
  public resolveQuestion(query: string, currentNodeId?: string): ResolveQuestionResult {
    const rawQuery = (query || '').trim();
    const resolution = this.engine.processQuestionSync(rawQuery, { currentNodeId });

    if (resolution.isResolved) {
      const flowNodeId = resolution.flowNodeId || 'node_root';
      const existingNode = FLOW_NODES[flowNodeId];

      const node: HelpFlowNode = existingNode
        ? {
            ...existingNode,
            message: resolution.answer || existingNode.message,
            action: resolution.suggestedAction || existingNode.action,
          }
        : {
            id: flowNodeId,
            topicId: resolution.matchedTopic || 'stay_info',
            title: resolution.matchedTopic || 'Guest Support',
            message: resolution.answer,
            choices: HELP_TOPICS.slice(0, 3).map((t) => ({
              id: t.id,
              label: t.title,
              nextNodeId: t.rootNodeId,
              icon: t.icon,
            })),
            action: resolution.suggestedAction,
            canGoBack: true,
            parentNodeId: currentNodeId || 'node_root',
          };

      return {
        isResolved: true,
        confidence: resolution.confidence,
        matchedTopic: resolution.matchedTopic,
        category: resolution.category,
        node,
        suggestedAction: resolution.suggestedAction || node.action,
        suggestedFollowUps: resolution.suggestedFollowUps,
        knowledgeEntryId: resolution.knowledgeEntryId,
        source: resolution.source,
        originalQuery: rawQuery,
      };
    }

    // Safe Grounded Fallback Node
    const fallbackNode: HelpFlowNode = {
      id: 'node_fallback',
      topicId: 'front_desk',
      title: 'How can we help?',
      message: resolution.answer,
      choices: HELP_TOPICS.slice(0, 4).map((t) => ({
        id: t.id,
        label: t.title,
        description: t.description,
        nextNodeId: t.rootNodeId,
        icon: t.icon,
      })),
      action: resolution.suggestedAction || {
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
      category: resolution.category,
      node: fallbackNode,
      suggestedAction: resolution.suggestedAction || fallbackNode.action,
      suggestedFollowUps: resolution.suggestedFollowUps,
      originalQuery: rawQuery,
    };
  }

  /**
   * Async resolution method
   */
  public async resolveQuestionAsync(query: string, currentNodeId?: string): Promise<ResolveQuestionResult> {
    return this.resolveQuestion(query, currentNodeId);
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
    BotMessageService.resetToDefaults();
    HotelKnowledgeBase.resetToDefaults();
    AssistantEngineProvider.resetToDefault();
  }
}
