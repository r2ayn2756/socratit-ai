/**
 * ALWAYS VISIBLE AI CHAT
 * Persistent, always-open chat interface for students during assignments
 * Like a messaging app sidebar - zero friction, always ready
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiTAService } from '../../services/aiTA.service';
import { websocketService } from '../../services/websocket.service';
import {
  MessageSquare,
  Send,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: Date;
  wasHelpful?: boolean;
}

interface AlwaysVisibleAIChatProps {
  assignmentId: string;
  assignmentTitle?: string;
  currentQuestionId?: string;
  currentQuestionText?: string;
}

export const AlwaysVisibleAIChat: React.FC<AlwaysVisibleAIChatProps> = ({
  assignmentId,
  assignmentTitle,
  currentQuestionId,
  currentQuestionText,
}) => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Initialize conversation on mount
  useEffect(() => {
    initializeConversation();
  }, []);

  // Initialize WebSocket when conversation exists
  useEffect(() => {
    if (conversationId) {
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        websocketService.connect(authToken);
        websocketService.joinConversation(conversationId);

        return () => {
          websocketService.leaveConversation(conversationId);
        };
      }
    }
  }, [conversationId]);

  const initializeConversation = async () => {
    try {
      const conversation = await aiTAService.createConversation({
        assignmentId,
        conversationType: 'ASSIGNMENT_HELP',
        title: `Help with ${assignmentTitle || 'Assignment'}`,
      });
      setConversationId(conversation.id);

      // Add welcome message
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'ASSISTANT',
        content: `Hey! 👋 I'm Socrat It, your learning companion. I'm here to help you understand this assignment.\n\nAsk me anything! I'll guide you through the concepts without giving you direct answers.`,
        createdAt: new Date(),
      };
      setMessages([welcomeMessage]);
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      setInitError(error.response?.data?.message || error.message || 'Failed to connect to AI');

      const errorMessage: Message = {
        id: 'error',
        role: 'ASSISTANT',
        content: `⚠️ I'm having trouble connecting right now.\n\n${error.response?.data?.message || 'The backend server might not be running.'}\n\nPlease contact your teacher if this continues.`,
        createdAt: new Date(),
      };
      setMessages([errorMessage]);
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || isStreaming || !conversationId) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'USER',
      content: inputValue,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Send via WebSocket for streaming
    setIsStreaming(true);
    setIsTyping(true);

    websocketService.sendMessage(conversationId, inputValue, {
      onThinking: () => setIsTyping(true),
      onToken: (token: string) => {
        setStreamingMessage((prev) => prev + token);
      },
      onComplete: (fullResponse: string) => {
        const newMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'ASSISTANT',
          content: fullResponse,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, newMessage]);
        setStreamingMessage('');
        setIsStreaming(false);
        setIsTyping(false);
      },
      onError: (error: string) => {
        console.error('Error:', error);
        setIsTyping(false);
        setIsStreaming(false);
        setStreamingMessage('');

        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'ASSISTANT',
          content: `Sorry, I encountered an error: ${error}\n\nPlease try again or rephrase your question.`,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      },
    }, currentQuestionId);

    setInputValue('');
    inputRef.current?.focus();
  };

  const handleRateMessage = async (messageId: string, wasHelpful: boolean) => {
    try {
      await aiTAService.rateMessage(messageId, { wasHelpful });
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, wasHelpful } : msg
        )
      );
    } catch (error) {
      console.error('Error rating message:', error);
    }
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-blue to-brand-purple p-5 text-white flex-shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Socrat It</h3>
            <p className="text-xs text-white text-opacity-90">Always here to help</p>
          </div>
        </div>
        {assignmentTitle && (
          <div className="bg-white bg-opacity-10 rounded-lg px-3 py-2 mt-3">
            <p className="text-xs text-white text-opacity-80">Helping with:</p>
            <p className="text-sm font-medium truncate">{assignmentTitle}</p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'USER' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%]`}>
                {/* Role indicator */}
                {message.role === 'ASSISTANT' && (
                  <div className="flex items-center gap-2 mb-1 pl-1">
                    <div className="w-6 h-6 bg-gradient-to-r from-brand-blue to-brand-purple rounded-full flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-slate-600">Socrat It</span>
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === 'USER'
                      ? 'bg-brand-blue text-white shadow-md'
                      : 'bg-white text-slate-800 border border-slate-200 shadow-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Timestamp */}
                <div className={`flex items-center gap-2 mt-1 px-2 ${
                  message.role === 'USER' ? 'justify-end' : 'justify-start'
                }`}>
                  <span className="text-xs text-slate-400">
                    {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {/* AI message feedback */}
                  {message.role === 'ASSISTANT' && message.id !== 'welcome' && message.id !== 'error' && (
                    <>
                      <span className="text-xs text-slate-400">•</span>
                      <button
                        onClick={() => handleRateMessage(message.id, true)}
                        className={`p-1 rounded transition-colors ${
                          message.wasHelpful === true
                            ? 'text-green-600'
                            : 'text-slate-400 hover:text-green-600'
                        }`}
                        title="Helpful"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRateMessage(message.id, false)}
                        className={`p-1 rounded transition-colors ${
                          message.wasHelpful === false
                            ? 'text-red-600'
                            : 'text-slate-400 hover:text-red-600'
                        }`}
                        title="Not helpful"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Streaming message */}
        {isStreaming && streamingMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="max-w-[85%]">
              <div className="flex items-center gap-2 mb-1 pl-1">
                <div className="w-6 h-6 bg-gradient-to-r from-brand-blue to-brand-purple rounded-full flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-medium text-slate-600">Socrat It</span>
              </div>
              <div className="bg-white text-slate-800 border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{streamingMessage}</p>
                <span className="inline-block w-1.5 h-4 bg-brand-blue animate-pulse ml-1"></span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Typing indicator */}
        {isTyping && !streamingMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="max-w-[85%]">
              <div className="flex items-center gap-2 mb-1 pl-1">
                <div className="w-6 h-6 bg-gradient-to-r from-brand-blue to-brand-purple rounded-full flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-medium text-slate-600">Socrat It</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error state */}
        {initError && messages.length <= 1 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 mb-1">Connection Error</p>
                <p className="text-xs text-red-600">{initError}</p>
                <button
                  onClick={initializeConversation}
                  className="mt-2 text-xs text-red-700 underline hover:text-red-800"
                >
                  Try reconnecting
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0">
        {/* Quick tips */}
        {messages.length === 1 && !isStreaming && (
          <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-medium text-blue-900 mb-1">💡 Quick Tips:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Ask me to explain concepts</li>
              <li>• I'll guide you, not give answers</li>
              <li>• Ask follow-up questions anytime</li>
            </ul>
          </div>
        )}

        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your question..."
            disabled={isStreaming || !conversationId}
            className="flex-1 px-4 py-3 text-sm border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed transition-all"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isStreaming || !conversationId}
            className="px-5 py-3 bg-gradient-to-r from-brand-blue to-brand-purple text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center gap-2 font-medium"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">
          Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs">Enter</kbd> to send
        </p>
      </div>

      {/* Connection indicator */}
      {conversationId && (
        <div className="absolute top-24 right-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-green-700">Connected</span>
        </div>
      )}
    </div>
  );
};
