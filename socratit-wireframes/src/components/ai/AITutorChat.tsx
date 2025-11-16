/**
 * AI TUTOR CHAT COMPONENT
 * Real-time streaming chat interface for AI Teaching Assistant
 * Matches Socratit.ai design system
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { aiTAService } from '../../services/aiTA.service';
import { websocketService } from '../../services/websocket.service';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: Date;
  wasHelpful?: boolean;
}

interface AITutorChatProps {
  conversationId: string;
  assignmentId?: string;
  initialMessage?: string;
  onClose: () => void;
}

export const AITutorChat: React.FC<AITutorChatProps> = ({
  conversationId,
  assignmentId,
  initialMessage,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasAutoSent, setHasAutoSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Initialize WebSocket connection
  useEffect(() => {
    // Get auth token from localStorage
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      console.error('No auth token found');
      return;
    }

    // Connect to WebSocket
    websocketService.connect(authToken);

    // Join conversation room
    websocketService.joinConversation(conversationId);

    // Cleanup
    return () => {
      websocketService.leaveConversation(conversationId);
    };
  }, [conversationId]);

  // Load conversation history
  useEffect(() => {
    loadConversation();
  }, [conversationId]);

  const loadConversation = async () => {
    try {
      const data = await aiTAService.getConversation(conversationId);
      setMessages(data.messages.map((msg: any) => ({
        ...msg,
        createdAt: new Date(msg.createdAt)
      })));
    } catch (error) {
      console.error('Error loading conversation:', error);
      // eslint-disable-next-line no-alert
      alert('Failed to load conversation history.');
    }
  };

  // Auto-send initial message if provided
  useEffect(() => {
    if (initialMessage && !hasAutoSent && messages.length === 0 && !isStreaming) {
      // Wait a bit for websocket to be ready
      const timer = setTimeout(() => {
        setInputValue(initialMessage);
        setHasAutoSent(true);
        // Trigger send
        sendMessageWithContent(initialMessage);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialMessage, hasAutoSent, messages.length, isStreaming]);

  const handleTokenStream = (data: { token: string }) => {
    setStreamingMessage((prev) => prev + data.token);
  };

  const handleMessageComplete = (data: { fullResponse: string }) => {
    const newMessage: Message = {
      id: Math.random().toString(),
      role: 'ASSISTANT',
      content: data.fullResponse,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setStreamingMessage('');
    setIsStreaming(false);
    setIsTyping(false);
  };

  const handleError = (data: { error: string }) => {
    alert(`Error: ${data.error}`);
    setIsTyping(false);
    setIsStreaming(false);
  };

  // Extracted function to send message with specific content
  const sendMessageWithContent = (messageContent: string) => {
    if (!messageContent.trim() || isStreaming) return;

    // Add user message
    const userMessage: Message = {
      id: Math.random().toString(),
      role: 'USER',
      content: messageContent,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Send via WebSocket for streaming
    setIsStreaming(true);
    setIsTyping(true);

    websocketService.sendMessage(conversationId, messageContent, {
      onThinking: () => setIsTyping(true),
      onToken: (token: string) => {
        setStreamingMessage((prev) => prev + token);
      },
      onComplete: (fullResponse: string, usage: any) => {
        const newMessage: Message = {
          id: Math.random().toString(),
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
        alert(`Error: ${error}`);
        setIsTyping(false);
        setIsStreaming(false);
      },
    });

    setInputValue('');
  };

  const handleSendMessage = () => {
    sendMessageWithContent(inputValue);
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

  const handleShareWithTeacher = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Share this conversation with your teacher?')) {
      try {
        await aiTAService.shareConversation(conversationId);
        // eslint-disable-next-line no-alert
        alert('Conversation shared with your teacher!');
      } catch (error) {
        console.error('Error sharing:', error);
        // eslint-disable-next-line no-alert
        alert('Failed to share conversation. Please try again.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-blue to-brand-purple p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold">AI Tutor</h2>
                <p className="text-white text-opacity-80 text-sm">
                  {assignmentId ? 'Assignment Help' : 'General Help'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleShareWithTeacher} className="text-white border-white hover:bg-white hover:bg-opacity-10">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share with Teacher
              </Button>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${message.role === 'USER' ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`rounded-2xl px-5 py-3 ${
                      message.role === 'USER'
                        ? 'bg-brand-blue text-white shadow-lg shadow-blue-500/20'
                        : 'bg-white text-slate-800 shadow-lg border border-slate-200'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {/* AI message feedback */}
                  {message.role === 'ASSISTANT' && (
                    <div className="flex items-center gap-2 mt-2 pl-2">
                      <span className="text-xs text-slate-500">Was this helpful?</span>
                      <button
                        onClick={() => handleRateMessage(message.id, true)}
                        className={`p-1 rounded transition-colors ${
                          message.wasHelpful === true
                            ? 'text-green-600'
                            : 'text-slate-400 hover:text-green-600'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRateMessage(message.id, false)}
                        className={`p-1 rounded transition-colors ${
                          message.wasHelpful === false
                            ? 'text-red-600'
                            : 'text-slate-400 hover:text-red-600'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                        </svg>
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
              <div className="max-w-[80%] bg-white text-slate-800 rounded-2xl px-5 py-3 shadow-lg border border-slate-200">
                <p className="leading-relaxed whitespace-pre-wrap">{streamingMessage}</p>
                <span className="inline-block w-2 h-4 bg-brand-blue animate-pulse ml-1"></span>
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
              <div className="bg-white rounded-2xl px-5 py-4 shadow-lg border border-slate-200">
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
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="flex gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask me anything about your assignment..."
              className="flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              rows={2}
              disabled={isStreaming}
            />
            <Button
              variant="primary"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isStreaming}
              className="self-end"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </motion.div>
    </div>
  );
};
