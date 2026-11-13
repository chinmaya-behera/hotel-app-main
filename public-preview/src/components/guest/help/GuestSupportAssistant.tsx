'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  RotateCcw,
  X,
  ChevronRight,
  ChevronLeft,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Wrench,
  Utensils,
  HeartPulse,
  Info,
  Receipt,
  HelpCircle,
  PhoneCall,
  Compass,
  Check,
  Loader2,
  User,
  ArrowRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import type { GuestTabId } from '@/components/guest/types';
import { useDemo } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import {
  FLOW_NODES,
  HELP_TOPICS,
  type HelpFlowNode,
  type HelpOptionChoice,
  type HelpPortalAction,
} from '@/server/modules/guest/help/HelpCenterData';

interface GuestSupportAssistantProps {
  room: string;
  guestName: string;
  onNavigate: (tab: GuestTabId, subtab?: string) => void;
  isLight?: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  choices?: HelpOptionChoice[];
  action?: HelpPortalAction;
  suggestedFollowUps?: string[];
  canGoBack?: boolean;
  parentNodeId?: string;
  timestamp: string;
  feedbackGiven?: 'positive' | 'negative';
}

const ICON_MAP: Record<string, React.ElementType> = {
  Wrench,
  Sparkles,
  Utensils,
  HeartPulse,
  Info,
  Receipt,
  HelpCircle,
  PhoneCall,
  Compass,
};

export function GuestSupportAssistant({
  room,
  guestName,
  onNavigate,
  isLight: propIsLight,
}: GuestSupportAssistantProps) {
  const { state } = useDemo();
  const { t } = useI18n();
  // Live reactive theme sync with the demo store
  const isLight = state ? state.theme === 'light' : Boolean(propIsLight);

  // Derive guest first name for friendly personalization
  const guestFirstName = guestName && guestName.trim() ? guestName.trim().split(' ')[0] : 'Guest';

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState<string>('node_root');
  const [nodeHistory, setNodeHistory] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize conversation with welcome node
  useEffect(() => {
    const rootNode = FLOW_NODES['node_root'];
    const initialGreeting = guestName
      ? t('help.assistantGreeting', { name: guestFirstName, room })
      : t('help.assistantGenericGreeting');

    setMessages([
      {
        id: 'msg_welcome',
        sender: 'bot',
        text: initialGreeting,
        choices: rootNode.choices,
        suggestedFollowUps: [
          'How can I report an AC problem?',
          'Where can I order food?',
          'What time is checkout?',
          'What is the Wi-Fi password?',
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [guestFirstName, guestName, room, t]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isExpanded]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => textareaRef.current?.focus(), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelectChoice = async (choice: HelpOptionChoice) => {
    // 1. Add user reply bubble
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: choice.label,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);

    const targetNodeId = choice.nextNodeId || 'node_root';
    setNodeHistory((prev) => [...prev, currentNodeId]);
    setCurrentNodeId(targetNodeId);

    // 2. Fetch flow node from API (with fallback to client-side definition)
    try {
      let node: HelpFlowNode = FLOW_NODES[targetNodeId];
      try {
        const res = await fetch(`/api/v1/guest/help/flows/${encodeURIComponent(targetNodeId)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.node) {
            node = json.data.node;
          }
        }
      } catch {
        // Fallback to local node if offline
      }

      if (!node) {
        node = FLOW_NODES['node_root'];
      }

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: node.message,
        choices: node.choices,
        action: node.action,
        canGoBack: node.canGoBack,
        parentNodeId: node.parentNodeId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      // Error recovery
      const errorMsg: ChatMessage = {
        id: `bot_err_${Date.now()}`,
        sender: 'bot',
        text: 'Sorry, I had trouble retrieving that step. You can message Front Desk directly or choose another category.',
        choices: FLOW_NODES['node_root'].choices,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleBack = async (parentNodeId?: string) => {
    const previousNodeId = parentNodeId || (nodeHistory.length > 0 ? nodeHistory[nodeHistory.length - 1] : 'node_root');
    setNodeHistory((prev) => prev.slice(0, -1));
    setCurrentNodeId(previousNodeId);

    const node = FLOW_NODES[previousNodeId] || FLOW_NODES['node_root'];
    const botMsg: ChatMessage = {
      id: `bot_back_${Date.now()}`,
      sender: 'bot',
      text: `Returned to ${node.title}:\n${node.message}`,
      choices: node.choices,
      action: node.action,
      canGoBack: node.canGoBack,
      parentNodeId: node.parentNodeId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, botMsg]);
  };

  const handleRestart = () => {
    const rootNode = FLOW_NODES['node_root'];
    setCurrentNodeId('node_root');
    setNodeHistory([]);
    setMessages([
      {
        id: `msg_welcome_${Date.now()}`,
        sender: 'bot',
        text: `Conversation restarted. Hii ${guestFirstName}! How can we help you today with Room ${room}?`,
        choices: rootNode.choices,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const executeQuestionResolution = async (queryText: string) => {
    const query = queryText.trim();
    if (!query || isResolving) return;

    setInputText('');
    setIsResolving(true);

    // 1. Add user message
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);

    // 2. Resolve via backend API
    try {
      let resolvedNode: HelpFlowNode | null = null;
      let suggestedAction: HelpPortalAction | undefined = undefined;
      let suggestedFollowUps: string[] | undefined = undefined;

      try {
        const res = await fetch('/api/v1/guest/help/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: query, currentNodeId }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            resolvedNode = json.data.node;
            suggestedAction = json.data.suggestedAction;
            suggestedFollowUps = json.data.suggestedFollowUps;
          }
        }
      } catch {
        // Fallback local resolver
      }

      if (!resolvedNode) {
        resolvedNode = {
          id: 'node_fallback',
          topicId: 'front_desk',
          title: 'Guest Support',
          message: `I've noted your question: "${query}". You can connect directly with our Front Desk team, or explore the options below:`,
          choices: HELP_TOPICS.slice(0, 4).map((t) => ({
            id: t.id,
            label: t.title,
            description: t.description,
            nextNodeId: t.rootNodeId,
            icon: t.icon,
          })),
          action: {
            label: 'Message Front Desk',
            targetTab: 'services',
            targetSubtab: 'front_desk',
          },
        };
      }

      const botMsg: ChatMessage = {
        id: `bot_resolve_${Date.now()}`,
        sender: 'bot',
        text: resolvedNode.message,
        choices: resolvedNode.choices,
        action: suggestedAction || resolvedNode.action,
        suggestedFollowUps,
        canGoBack: true,
        parentNodeId: currentNodeId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      // Error handling
      const errorMsg: ChatMessage = {
        id: `bot_err_${Date.now()}`,
        sender: 'bot',
        text: 'Sorry, I was unable to resolve your inquiry. Please reach out to our Front Desk directly.',
        choices: FLOW_NODES['node_root'].choices,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsResolving(false);
    }
  };

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeQuestionResolution(inputText);
  };

  const submitFollowUp = async (questionText: string) => {
    await executeQuestionResolution(questionText);
  };

  const handleActionClick = (action: HelpPortalAction) => {
    if (action.actionType === 'tour') {
      window.dispatchEvent(new CustomEvent('open-guest-tour'));
      onNavigate('home');
    } else {
      onNavigate(action.targetTab as GuestTabId, action.targetSubtab);
    }
    setIsOpen(false);
  };

  const handleFeedback = async (messageId: string, helpful: boolean) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, feedbackGiven: helpful ? 'positive' : 'negative' } : m,
      ),
    );

    try {
      await fetch('/api/v1/guest/help/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowId: currentNodeId,
          helpful,
        }),
      });
    } catch {
      // Silent catch
    }
  };

  return (
    <>
      {/* 1. CUTE & ATTRACTIVE FLOATING AI LAUNCHER BUTTON (Bottom-Left Corner) */}
      <div className="fixed bottom-20 left-3 sm:bottom-6 sm:left-6 z-40 select-none">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={`Open AI Assistant for ${guestFirstName}`}
          aria-expanded={isOpen}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full transition-all duration-300 group hover:scale-105 active:scale-95 shadow-xl border cursor-pointer"
          style={{
            background: isLight
              ? 'linear-gradient(135deg, #0e7490 0%, #4f46e5 100%)'
              : 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)',
            borderColor: isLight ? 'rgba(255, 255, 255, 0.45)' : 'rgba(56, 189, 248, 0.4)',
            color: '#ffffff',
            boxShadow: isLight
              ? '0 12px 28px -6px rgba(14, 116, 144, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.3)'
              : '0 12px 28px -6px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(56, 189, 248, 0.25)',
          }}
        >
          {/* Cute Animated AI Avatar */}
          <div className="relative flex items-center justify-center shrink-0">
            <span className="text-xl sm:text-2xl filter drop-shadow select-none transition-transform group-hover:scale-115 group-hover:rotate-6">
              🤖
            </span>
            <span className="absolute -top-1.5 -right-2 text-xs animate-ping opacity-75">✨</span>
            <span className="absolute -top-1.5 -right-2 text-xs">✨</span>
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
          </div>

          {/* Friendly Hii Guest greeting */}
          <div className="flex flex-col text-left leading-tight">
            <span className="text-xs sm:text-sm font-black tracking-wide text-[#ffffff] drop-shadow-xs">
              Hii {guestFirstName}!
            </span>
            <span className="text-[10px] font-semibold text-cyan-100/90 tracking-normal hidden sm:inline">
              AI Concierge 24/7
            </span>
          </div>
        </button>
      </div>

      {/* 2. CHAT SUPPORT WINDOW: 3/4 COMPACT DRAWER ON MOBILE, OR FULL SCREEN WHOLE PAGE */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Guest Help Center Assistant"
          className={`fixed z-50 flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95 ${
            isExpanded
              ? 'fixed inset-0 w-full h-[100dvh] max-h-[100dvh] rounded-none border-none'
              : 'fixed inset-x-2 bottom-[68px] h-[72vh] max-h-[72dvh] sm:inset-auto sm:bottom-6 sm:left-6 sm:w-[440px] sm:h-[620px] sm:max-h-[85vh] rounded-2xl shadow-2xl border'
          }`}
          style={{
            background: isLight ? '#ffffff' : '#12203a',
            borderColor: isLight ? 'rgba(16, 30, 45, 0.12)' : 'rgba(255, 255, 255, 0.09)',
            color: isLight ? '#15202b' : '#e7edf8',
            boxShadow: isLight
              ? '0 25px 60px -15px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(16, 30, 45, 0.08)'
              : '0 25px 60px -15px rgba(0, 0, 0, 0.85)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b select-none shrink-0"
            style={{
              background: isLight
                ? 'linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 50%, #faf5ff 100%)'
                : '#0d172c',
              borderColor: isLight ? 'rgba(16, 30, 45, 0.08)' : 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="h-9 w-9 rounded-xl grid place-items-center shadow-xs shrink-0"
                style={{
                  background: isLight
                    ? 'linear-gradient(135deg, #0e7490, #6366f1)'
                    : 'linear-gradient(135deg, #38bdf8, #818cf8)',
                  color: isLight ? '#ffffff' : '#06080d',
                }}
              >
                <span className="text-lg">🤖</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3
                    className="text-xs sm:text-sm font-bold tracking-tight truncate"
                    style={{ color: isLight ? '#15202b' : '#ffffff' }}
                  >
                    The Grand ADP AI Assistant
                  </h3>
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0"
                    style={{
                      background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.15)',
                      color: isLight ? '#047857' : '#6ee7b7',
                      border: isLight ? '1px solid #a7f3d0' : '1px solid rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    Live 24/7
                  </span>
                </div>
                <p
                  className="text-[10px] font-medium truncate"
                  style={{ color: isLight ? '#55677c' : '#94a4bf' }}
                >
                  Room {room} · {guestName || 'Resident Guest'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Expand / Full Page Toggle */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Exit Full Page (Show 3/4)' : 'Cover Whole Page (Full Page)'}
                aria-label={isExpanded ? 'Exit Full Page' : 'Cover Whole Page'}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                style={{
                  color: isLight ? '#55677c' : '#94a4bf',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = isLight ? '#15202b' : '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = isLight ? '#55677c' : '#94a4bf';
                }}
              >
                {isExpanded ? (
                  <>
                    <Minimize2 className="h-4 w-4" />
                    <span className="hidden sm:inline text-[11px]">3/4 View</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4" />
                    <span className="hidden sm:inline text-[11px]">Full Page</span>
                  </>
                )}
              </button>

              {/* Restart conversation */}
              <button
                type="button"
                onClick={handleRestart}
                title="Restart Conversation"
                aria-label="Restart Conversation"
                className="p-1.5 rounded-lg transition-colors cursor-pointer"
                style={{
                  color: isLight ? '#55677c' : '#94a4bf',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = isLight ? '#15202b' : '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = isLight ? '#55677c' : '#94a4bf';
                }}
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                aria-label="Close Assistant"
                className="p-1.5 rounded-lg transition-colors cursor-pointer"
                style={{
                  color: isLight ? '#55677c' : '#94a4bf',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.color = isLight ? '#dc2626' : '#f87171';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = isLight ? '#55677c' : '#94a4bf';
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div
            className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 scroll-smooth"
            style={{
              background: isLight ? '#f8fafc' : '#0a1426',
            }}
          >
            <div className={`space-y-4 ${isExpanded ? 'max-w-4xl mx-auto w-full' : ''}`}>
              {messages.map((msg) => {
                const isBot = msg.sender === 'bot';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`flex items-end gap-2.5 max-w-[94%] ${
                        isBot ? 'flex-row' : 'flex-row-reverse'
                      }`}
                    >
                      {isBot ? (
                        <div
                          className="h-7 w-7 rounded-full grid place-items-center shrink-0 mb-1 text-sm shadow-xs"
                          style={{
                            background: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.15)',
                            border: isLight ? '1px solid #bae6fd' : '1px solid rgba(56, 189, 248, 0.25)',
                          }}
                        >
                          🤖
                        </div>
                      ) : (
                        <div
                          className="h-7 w-7 rounded-full grid place-items-center shrink-0 mb-1 shadow-xs"
                          style={{
                            background: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.15)',
                            color: isLight ? '#b45309' : '#fbbf24',
                            border: isLight ? '1px solid #fde68a' : '1px solid rgba(245, 158, 11, 0.25)',
                          }}
                        >
                          <User className="h-4 w-4" />
                        </div>
                      )}

                      <div
                        className="px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-xs"
                        style={{
                          background: isBot
                            ? isLight
                              ? '#ffffff'
                              : '#12203a'
                            : isLight
                              ? 'linear-gradient(135deg, #0e7490, #6366f1)'
                              : 'linear-gradient(135deg, #0284c7, #6366f1)',
                          color: isBot
                            ? isLight
                              ? '#15202b'
                              : '#e7edf8'
                            : '#ffffff',
                          border: isBot
                            ? isLight
                              ? '1px solid rgba(16, 30, 45, 0.09)'
                            : '1px solid rgba(255, 255, 255, 0.09)'
                          : 'none',
                          borderBottomLeftRadius: isBot ? '4px' : undefined,
                          borderBottomRightRadius: !isBot ? '4px' : undefined,
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>

                    {/* Direct Action Button (if attached to bot message) */}
                    {isBot && msg.action && (
                      <div className="mt-2.5 ml-9 w-[calc(100%-2.25rem)] max-w-sm">
                        <button
                          type="button"
                          onClick={() => handleActionClick(msg.action!)}
                          className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl font-bold text-xs transition-all duration-200 group active:scale-[0.98] shadow-md hover:shadow-lg cursor-pointer"
                          style={{
                            background: isLight
                              ? 'linear-gradient(135deg, #0e7490, #4f46e5)'
                              : 'linear-gradient(135deg, #0284c7, #6366f1)',
                            color: '#ffffff',
                            border: isLight ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(56, 189, 248, 0.3)',
                          }}
                        >
                          <span className="truncate">{msg.action.label}</span>
                          <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    )}

                    {/* Suggested Follow-Up Chips (GUEST-HELP-02 Phase 3 & 4) */}
                    {isBot && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                      <div className="mt-2.5 ml-9 w-[calc(100%-2.25rem)] max-w-md">
                        <div
                          className="flex items-center gap-1.5 mb-1.5 text-[11px] font-semibold"
                          style={{ color: isLight ? '#0e7490' : '#38bdf8' }}
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>Suggested follow-up questions:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestedFollowUps.map((fu, idx) => (
                            <button
                              key={`fu_${msg.id}_${idx}`}
                              type="button"
                              onClick={() => submitFollowUp(fu)}
                              disabled={isResolving}
                              className="text-left text-xs px-2.5 py-1.5 rounded-lg border transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 cursor-pointer shadow-2xs"
                              style={{
                                background: isLight ? '#f0fdfa' : 'rgba(56, 189, 248, 0.08)',
                                borderColor: isLight ? '#99f6e4' : 'rgba(56, 189, 248, 0.25)',
                                color: isLight ? '#0f766e' : '#38bdf8',
                              }}
                            >
                              💬 {fu}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Choice Chips / Option Cards */}
                    {isBot && msg.choices && msg.choices.length > 0 && (
                      <div
                        className={`mt-3 ml-9 w-[calc(100%-2.25rem)] ${
                          isExpanded
                            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5'
                            : 'space-y-1.5'
                        }`}
                      >
                        {msg.choices.map((choice) => {
                          const Icon = choice.icon ? ICON_MAP[choice.icon] || Sparkles : ChevronRight;

                          return (
                            <button
                              key={choice.id}
                              type="button"
                              onClick={() => handleSelectChoice(choice)}
                              className="w-full text-left flex items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-xl text-xs font-semibold transition-all duration-150 border group shadow-xs cursor-pointer"
                              style={{
                                background: isLight ? '#ffffff' : '#12203a',
                                borderColor: isLight ? 'rgba(16, 30, 45, 0.09)' : 'rgba(255, 255, 255, 0.09)',
                                color: isLight ? '#15202b' : '#e7edf8',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = isLight ? '#0e7490' : '#38bdf8';
                                e.currentTarget.style.background = isLight ? '#f0fdfa' : '#162746';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = isLight ? 'rgba(16, 30, 45, 0.09)' : 'rgba(255, 255, 255, 0.09)';
                                e.currentTarget.style.background = isLight ? '#ffffff' : '#12203a';
                              }}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className="p-1.5 sm:p-2 rounded-lg shrink-0 transition-colors"
                                  style={{
                                    background: isLight ? '#ecfeff' : '#0d172c',
                                    color: isLight ? '#0e7490' : '#38bdf8',
                                    border: isLight ? '1px solid #cffafe' : '1px solid rgba(255, 255, 255, 0.08)',
                                  }}
                                >
                                  <Icon className="h-4 w-4" />
                                </span>
                                <div className="min-w-0">
                                  <div
                                    className="truncate font-semibold text-xs sm:text-sm"
                                    style={{ color: isLight ? '#15202b' : '#e7edf8' }}
                                  >
                                    {choice.label}
                                  </div>
                                  {choice.description && (
                                    <div
                                      className="text-[10.5px] truncate leading-tight mt-0.5"
                                      style={{ color: isLight ? '#55677c' : '#94a4bf' }}
                                    >
                                      {choice.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <ChevronRight
                                className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                                style={{ color: isLight ? '#94a3b8' : '#64748b' }}
                              />
                            </button>
                          );
                        })}

                        {/* Back button if available */}
                        {msg.canGoBack && (
                          <div className={isExpanded ? 'sm:col-span-2 md:col-span-3' : ''}>
                            <button
                              type="button"
                              onClick={() => handleBack(msg.parentNodeId)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors mt-2 shadow-xs cursor-pointer"
                              style={{
                                background: isLight ? '#ffffff' : '#12203a',
                                color: isLight ? '#0e7490' : '#38bdf8',
                                border: isLight ? '1px solid #cffafe' : '1px solid rgba(56, 189, 248, 0.3)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = isLight ? '#ecfeff' : '#162746';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = isLight ? '#ffffff' : '#12203a';
                              }}
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                              <span>Back to previous choices</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Feedback rating row */}
                    {isBot && msg.action && !msg.feedbackGiven && (
                      <div
                        className="mt-2 ml-9 flex items-center gap-2 text-xs font-medium"
                        style={{ color: isLight ? '#55677c' : '#94a4bf' }}
                      >
                        <span className="text-[11px]">Did this resolve your question?</span>
                        <button
                          type="button"
                          onClick={() => handleFeedback(msg.id, true)}
                          className="px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 text-[11px] shadow-xs cursor-pointer"
                          style={{
                            background: isLight ? '#ffffff' : '#12203a',
                            color: isLight ? '#15202b' : '#e7edf8',
                            borderColor: isLight ? 'rgba(16, 30, 45, 0.12)' : 'rgba(255, 255, 255, 0.1)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.2)';
                            e.currentTarget.style.color = isLight ? '#047857' : '#6ee7b7';
                            e.currentTarget.style.borderColor = isLight ? '#a7f3d0' : 'rgba(16, 185, 129, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = isLight ? '#ffffff' : '#12203a';
                            e.currentTarget.style.color = isLight ? '#15202b' : '#e7edf8';
                            e.currentTarget.style.borderColor = isLight ? 'rgba(16, 30, 45, 0.12)' : 'rgba(255, 255, 255, 0.1)';
                          }}
                          title="Yes, helpful"
                        >
                          <ThumbsUp className="h-3 w-3" />
                          <span>Yes</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeedback(msg.id, false)}
                          className="px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 text-[11px] shadow-xs cursor-pointer"
                          style={{
                            background: isLight ? '#ffffff' : '#12203a',
                            color: isLight ? '#15202b' : '#e7edf8',
                            borderColor: isLight ? 'rgba(16, 30, 45, 0.12)' : 'rgba(255, 255, 255, 0.1)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = isLight ? '#fff1f2' : 'rgba(244, 63, 94, 0.2)';
                            e.currentTarget.style.color = isLight ? '#be123c' : '#fda4af';
                            e.currentTarget.style.borderColor = isLight ? '#fecdd3' : 'rgba(244, 63, 94, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = isLight ? '#ffffff' : '#12203a';
                            e.currentTarget.style.color = isLight ? '#15202b' : '#e7edf8';
                            e.currentTarget.style.borderColor = isLight ? 'rgba(16, 30, 45, 0.12)' : 'rgba(255, 255, 255, 0.1)';
                          }}
                          title="No, need more help"
                        >
                          <ThumbsDown className="h-3 w-3" />
                          <span>No</span>
                        </button>
                      </div>
                    )}

                    {isBot && msg.feedbackGiven && (
                      <div
                        className="mt-1.5 ml-9 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border shadow-xs"
                        style={{
                          background: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.15)',
                          color: isLight ? '#047857' : '#6ee7b7',
                          borderColor: isLight ? '#a7f3d0' : 'rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Thank you for your feedback!</span>
                      </div>
                    )}

                    {/* Timestamp */}
                    <span
                      className="text-[9px] mt-1 px-1 font-medium"
                      style={{ color: isLight ? '#94a3b8' : '#64748b' }}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}

              {isResolving && (
                <div
                  className="flex items-center gap-2 text-xs ml-9 font-medium"
                  style={{ color: isLight ? '#0e7490' : '#38bdf8' }}
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Finding best guidance for your stay...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Footer: Always pinned and 100% visible with safe-area padding */}
          <form
            onSubmit={handleQuerySubmit}
            className="p-3 sm:p-4 border-t flex items-center gap-2 shrink-0 z-10"
            style={{
              background: isLight ? '#ffffff' : '#0d172c',
              borderColor: isLight ? 'rgba(16, 30, 45, 0.08)' : 'rgba(255, 255, 255, 0.08)',
              paddingBottom: isExpanded ? 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' : undefined,
            }}
          >
            <div className={`flex items-center gap-2 w-full ${isExpanded ? 'max-w-4xl mx-auto' : ''}`}>
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (inputText.trim() && !isResolving) {
                      executeQuestionResolution(inputText);
                    }
                  }
                }}
                placeholder={t('help.askAnythingPlaceholder')}
                disabled={isResolving}
                className="flex-1 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none transition-all shadow-inner resize-none max-h-24 leading-normal"
                style={{
                  background: isLight ? '#f8fafc' : '#09101f',
                  color: isLight ? '#15202b' : '#e7edf8',
                  borderColor: isLight ? 'rgba(16, 30, 45, 0.12)' : 'rgba(255, 255, 255, 0.12)',
                  borderWidth: '1px',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = isLight ? '#0e7490' : '#38bdf8';
                  e.currentTarget.style.background = isLight ? '#ffffff' : '#0c162b';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = isLight ? 'rgba(16, 30, 45, 0.12)' : 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.background = isLight ? '#f8fafc' : '#09101f';
                }}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isResolving}
                aria-label="Send question"
                className="p-2.5 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-md active:scale-95 shrink-0 cursor-pointer"
                style={{
                  background: isLight
                    ? 'linear-gradient(135deg, #0e7490, #4f46e5)'
                    : 'linear-gradient(135deg, #0284c7, #6366f1)',
                  color: '#ffffff',
                }}
              >
                {isResolving ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#ffffff]" />
                ) : (
                  <Send className="h-4 w-4 text-[#ffffff]" />
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
