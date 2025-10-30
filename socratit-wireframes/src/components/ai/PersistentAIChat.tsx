/**
 * PERSISTENT AI CHAT
 * Always-visible chat box for students during assignments
 * Collapsed by default, expands when clicked
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiTAService } from '../../services/aiTA.service';
import { websocketService } from '../../services/websocket.service';
import {
  MessageSquare,
  X,
  Send,
  ThumbsUp,
  ThumbsDown,
  Minimize2,
  Maximize2,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: Date;
  wasHelpful?: boolean;
}

interface PersistentAIChatProps {
  assignmentId: string;
  assignmentTitle?: string;
}

export const PersistentAIChat: React.FC<PersistentAIChatProps> = ({
  assignmentId,
  assignmentTitle,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Initialize conversation when chat is first expanded
  useEffect(() => {
    if (isExpanded && !conversationId) {
      initializeConversation();
    }
  }, [isExpanded]);

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
        content: `Hi! I'm here to help you with this assignment. Ask me questions and I'll guide you through the concepts. Remember, I won't give you direct answers, but I'll help you learn!`,
        createdAt: new Date(),
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Error creating conversation:', error);
      const errorMessage: Message = {
        id: 'error',
        role: 'ASSISTANT',
        content: `Sorry, I'm having trouble connecting right now. Please try refreshing the page or contact your teacher if the problem persists.`,
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
          content: `Sorry, I encountered an error. Please try again or rephrase your question.`,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      },
    });

    setInputValue('');
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

  // Collapsed button
  if (!isExpanded) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <button
          onClick={() => setIsExpanded(true)}
          className="w-16 h-16 bg-gradient-to-r from-brand-blue to-brand-purple text-white rounded-full shadow-2xl flex items-center justify-center hover:shadow-3xl transition-shadow group"
        >
          <MessageSquare className="w-8 h-8" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></span>
        </button>
        <div className="absolute bottom-20 right-0 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Get AI Help
        </div>
      </motion.div>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <motion.div
        initial={{ y: 400 }}
        animate={{ y: 0 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <div className="bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden w-80">
          <div className="bg-gradient-to-r from-brand-blue to-brand-purple p-4 text-white flex items-center justify-between cursor-pointer"
            onClick={() => setIsMinimized(false)}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5" />
              <span className="font-semibold">AI Assistant</span>
              {messages.length > 1 && (
                <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                  {messages.length - 1}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(false);
                }}
                className="hover:bg-white hover:bg-opacity-10 rounded p-1"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                  setIsMinimized(false);
                }}
                className="hover:bg-white hover:bg-opacity-10 rounded p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Expanded chat
  return (
    <motion.div
      initial={{ y: 400, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 400, opacity: 0 }}
      className="fixed bottom-6 right-6 z-40 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-blue to-brand-purple p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">AI Tutor</h3>
              <p className="text-xs text-white text-opacity-80">Assignment Help</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="hover:bg-white hover:bg-opacity-10 rounded p-2 transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsExpanded(false);
                setIsMinimized(false);
              }}
              className="hover:bg-white hover:bg-opacity-10 rounded p-2 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'USER' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%]`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 ${
                    message.role === 'USER'
                      ? 'bg-brand-blue text-white'
                      : 'bg-white text-slate-800 border border-slate-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* AI message feedback */}
                {message.role === 'ASSISTANT' && message.id !== 'welcome' && message.id !== 'error' && (
                  <div className="flex items-center gap-2 mt-1 pl-2">
                    <button
                      onClick={() => handleRateMessage(message.id, true)}
                      className={`p-1 rounded transition-colors ${
                        message.wasHelpful === true
                          ? 'text-green-600'
                          : 'text-slate-400 hover:text-green-600'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleRateMessage(message.id, false)}
                      className={`p-1 rounded transition-colors ${
                        message.wasHelpful === false
                          ? 'text-red-600'
                          : 'text-slate-400 hover:text-red-600'
                      }`}
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </div>
                )}
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
            <div className="max-w-[85%] bg-white text-slate-800 border border-slate-200 rounded-2xl px-4 py-2.5">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{streamingMessage}</p>
              <span className="inline-block w-1.5 h-4 bg-brand-blue animate-pulse ml-1"></span>
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
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask a question..."
            disabled={isStreaming || !conversationId}
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isStreaming || !conversationId}
            className="px-4 py-2 bg-gradient-to-r from-brand-blue to-brand-purple text-white rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-1.5 text-center">
          Press Enter to send
        </p>
      </div>
    </motion.div>
  );
};
