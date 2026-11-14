/**
 * Centralized Bot Message & Copy Configuration (GUEST-HELP-02 Phase 2)
 *
 * Separates generic chatbot behavior, greetings, prompts, and fallback copy
 * from hotel-specific factual knowledge and React UI components.
 */

export interface BotMessageConfiguration {
  welcomeMessageTemplate: string;
  genericWelcomeMessage: string;
  followUpGreeting: string;
  topicIntroductionTemplate: string;
  fallbackMessage: string;
  outOfScopeMessage: string;
  frontDeskGuidance: string;
  suggestedFollowUpPrompt: string;
  actionButtonLabels: {
    maintenance: string;
    housekeeping: string;
    dining: string;
    spa: string;
    frontDesk: string;
    dnd: string;
    folio: string;
    activity: string;
    tour: string;
  };
  feedbackPrompts: {
    wasHelpful: string;
    thankYou: string;
    sorryHelpDesk: string;
  };
  errorMessages: {
    emptyQuestion: string;
    questionTooLong: string;
    networkError: string;
    genericError: string;
  };
}

export const DEFAULT_BOT_MESSAGES: BotMessageConfiguration = {
  welcomeMessageTemplate: "Hello {name}! I am your Grand ADP Guest Assistant. How can we assist you with Room {room} today? Choose a topic below or type any question.",
  genericWelcomeMessage: "Hello! Welcome to The Grand ADP Guest Support. How can we assist you today? Choose a topic below or type any question.",
  followUpGreeting: "Is there anything else we can assist you with today?",
  topicIntroductionTemplate: "Here is what we can help with regarding {topicTitle}:",
  fallbackMessage: "I'm sorry, I couldn't find a reliable answer to that question in our hotel directory. Please choose a topic below or connect with our Front Desk team.",
  outOfScopeMessage: "I am specifically trained to assist with The Grand ADP hotel facilities, in-room services, policies, and Guest Portal features. For external inquiries, our Front Desk concierge will be delighted to assist you.",
  frontDeskGuidance: "Our 24/7 Front Desk is always available to assist you in person or directly via the portal message desk.",
  suggestedFollowUpPrompt: "You might also want to know:",
  actionButtonLabels: {
    maintenance: "Create Maintenance Request",
    housekeeping: "Open Housekeeping Request",
    dining: "View Menu / Place Order",
    spa: "Book Spa & Wellness",
    frontDesk: "Contact Front Desk",
    dnd: "Open DND Settings",
    folio: "View Stay / Checkout Details",
    activity: "Track My Requests",
    tour: "Take Interactive Tour",
  },
  feedbackPrompts: {
    wasHelpful: "Was this answer helpful?",
    thankYou: "Thank you for your feedback!",
    sorryHelpDesk: "We're sorry this didn't resolve your inquiry. Our Front Desk team is standing by to help.",
  },
  errorMessages: {
    emptyQuestion: "Please enter a question before sending.",
    questionTooLong: "Questions must be under 500 characters. Please shorten your message.",
    networkError: "Unable to reach the support assistant server. Please verify your connection or message Front Desk.",
    genericError: "An unexpected error occurred while processing your request. Please try again.",
  },
};

/**
 * Singleton configuration holder with customization API
 */
export class BotMessageService {
  private static instance: BotMessageConfiguration = { ...DEFAULT_BOT_MESSAGES };

  public static getConfig(): BotMessageConfiguration {
    return this.instance;
  }

  public static updateConfig(overrides: Partial<BotMessageConfiguration>): BotMessageConfiguration {
    this.instance = {
      ...this.instance,
      ...overrides,
      actionButtonLabels: {
        ...this.instance.actionButtonLabels,
        ...(overrides.actionButtonLabels || {}),
      },
      feedbackPrompts: {
        ...this.instance.feedbackPrompts,
        ...(overrides.feedbackPrompts || {}),
      },
      errorMessages: {
        ...this.instance.errorMessages,
        ...(overrides.errorMessages || {}),
      },
    };
    return this.instance;
  }

  public static resetToDefaults(): void {
    this.instance = { ...DEFAULT_BOT_MESSAGES };
  }
}
