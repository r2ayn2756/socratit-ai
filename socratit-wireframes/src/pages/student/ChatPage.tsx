/**
 * CHATGPT-STYLE CHAT PAGE
 * Full-screen ChatGPT-style interface for AI conversations
 * Modern, clean design matching Socratit's design system
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Sparkles,
  Menu,
  X,
  Trash2,
  MoreVertical,
  ChevronLeft,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { aiTAService } from '../../services/aiTA.service';
import { websocketService } from '../../services/websocket.service';
import { Button } from '../../components/common/Button';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: Date;
  wasHelpful?: boolean;
}

interface Conversation {
  id: string;
  title: string | null;
  conversationType: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hasAutoSent, setHasAutoSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Check if we should auto-open a conversation from navigation state
  useEffect(() => {
    const state = location.state as {
      conversationId?: string;
      autoOpen?: boolean;
      initialMessage?: string;
    } | null;
    if (state?.conversationId && state?.autoOpen) {
      setSelectedConversation(state.conversationId);
      if (state.initialMessage) {
        // Will be handled by the auto-send effect
      }
    }
  }, [location.state]);

  // Fetch conversations
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: () => aiTAService.listConversations({ isActive: true }),
  });

  const conversations = (data?.conversations || []) as Conversation[];

  // Initialize WebSocket connection when conversation is selected
  useEffect(() => {
    if (!selectedConversation) return;

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      console.error('No auth token found');
      return;
    }

    // Connect to WebSocket
    websocketService.connect(authToken);

    // Join conversation room
    websocketService.joinConversation(selectedConversation);

    // Cleanup
    return () => {
      websocketService.leaveConversation(selectedConversation);
    };
  }, [selectedConversation]);

  // Load conversation history when selected
  useEffect(() => {
    if (!selectedConversation) return;

    const loadConversation = async () => {
      try {
        const data = await aiTAService.getConversation(selectedConversation);
        setMessages(
          data.messages.map((msg: any) => ({
            ...msg,
            createdAt: new Date(msg.createdAt),
          }))
        );
      } catch (error) {
        console.error('Error loading conversation:', error);
      }
    };

    loadConversation();
  }, [selectedConversation]);

  // Auto-send initial message if provided
  useEffect(() => {
    const state = location.state as {
      conversationId?: string;
      autoOpen?: boolean;
      initialMessage?: string;
    } | null;

    if (
      state?.initialMessage &&
      !hasAutoSent &&
      messages.length === 0 &&
      !isStreaming &&
      selectedConversation
    ) {
      const initialMsg = state.initialMessage;
      const timer = setTimeout(() => {
        setInputValue(initialMsg);
        setHasAutoSent(true);
        sendMessageWithContent(initialMsg);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.state, hasAutoSent, messages.length, isStreaming, selectedConversation]);

  const sendMessageWithContent = (messageContent: string) => {
    if (!messageContent.trim() || isStreaming || !selectedConversation) return;

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

    websocketService.sendMessage(selectedConversation, messageContent, {
      onThinking: () => setIsTyping(true),
      onToken: (token: string) => {
        setStreamingMessage((prev) => prev + token);
      },
      onComplete: (fullResponse: string) => {
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
        refetch(); // Update conversation list
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

  const handleNewConversation = async () => {
    try {
      const conversation = await aiTAService.createConversation({
        conversationType: 'GENERAL_HELP',
        title: 'New Conversation',
      });
      setSelectedConversation(conversation.id);
      setMessages([]);
      setStreamingMessage('');
      setHasAutoSent(false);
      refetch();
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const handleRateMessage = async (messageId: string, wasHelpful: boolean) => {
    try {
      await aiTAService.rateMessage(messageId, { wasHelpful });
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, wasHelpful } : msg))
      );
    } catch (error) {
      console.error('Error rating message:', error);
    }
  };

  const handleShareConversation = async () => {
    if (!selectedConversation) return;
    if (window.confirm('Share this conversation with your teacher?')) {
      try {
        await aiTAService.shareConversation(selectedConversation);
        alert('Conversation shared with your teacher!');
      } catch (error) {
        console.error('Error sharing:', error);
        alert('Failed to share conversation. Please try again.');
      }
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar - Conversation History */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-800">
              <Button
                variant="primary"
                size="sm"
                onClick={handleNewConversation}
                className="w-full justify-start gap-2 bg-white text-slate-900 hover:bg-slate-100"
              >
                <Plus className="w-4 h-4" />
                New Conversation
              </Button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isLoading ? (
                <div className="text-slate-400 text-sm text-center py-8">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="text-slate-400 text-sm text-center py-8">
                  No conversations yet
                </div>
              ) : (
                conversations.map((conv) => (
                  <motion.button
                    key={conv.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedConversation(conv.id);
                      setMessages([]);
                      setStreamingMessage('');
                      setHasAutoSent(false);
                    }}
                    className={`w-full text-left px-3 py-3 rounded-lg transition-all group ${
                      selectedConversation === conv.id
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {conv.title || 'Untitled Conversation'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {conv.messageCount} messages
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))
              )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-slate-800">
              <button
                onClick={() => navigate('/student/dashboard')}
                className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800/50 transition-all text-sm flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Top Navigation */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-slate-600" />
              ) : (
                <Menu className="w-5 h-5 text-slate-600" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">SocratIt AI</h1>
                <p className="text-xs text-slate-500">Your 24/7 Learning Assistant</p>
              </div>
            </div>
          </div>

          {selectedConversation && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleShareConversation}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Share with teacher"
              >
                <Share2 className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          )}
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {!selectedConversation ? (
            // Welcome Screen
            <div className="h-full flex items-center justify-center p-8">
              <div className="max-w-2xl text-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/30"
                >
                  <Sparkles className="w-12 h-12 text-white" />
                </motion.div>
                <h2 className="text-4xl font-bold text-slate-900 mb-4">
                  Welcome to SocratIt AI
                </h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Your personal AI tutor, available 24/7 to help you understand concepts,
                  solve problems, and ace your assignments.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto mb-8">
                  {[
                    {
                      title: 'Instant Help',
                      description: 'Get answers to your questions in real-time',
                      icon: '⚡',
                    },
                    {
                      title: 'Step-by-Step',
                      description: 'Break down complex problems into simple steps',
                      icon: '📝',
                    },
                    {
                      title: 'Concept Mastery',
                      description: 'Deep understanding, not just answers',
                      icon: '🎯',
                    },
                    {
                      title: 'Always Available',
                      description: 'Study on your schedule, day or night',
                      icon: '🌟',
                    },
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-slate-50 rounded-xl text-left"
                    >
                      <div className="text-2xl mb-2">{feature.icon}</div>
                      <h3 className="font-bold text-slate-900 mb-1">{feature.title}</h3>
                      <p className="text-sm text-slate-600">{feature.description}</p>
                    </motion.div>
                  ))}
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleNewConversation}
                  className="shadow-lg shadow-purple-500/30"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Start Your First Conversation
                </Button>
              </div>
            </div>
          ) : messages.length === 0 && !isTyping && !streamingMessage ? (
            // Empty Conversation State
            <div className="h-full flex items-center justify-center p-8">
              <div className="max-w-md text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  Ready to help!
                </h3>
                <p className="text-slate-600 mb-6">
                  Ask me anything about your homework, concepts you're learning, or problems
                  you need help with.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    'Help me understand quadratic equations',
                    'What are the causes of World War I?',
                    'Explain photosynthesis step by step',
                    'How do I solve this calculus problem?',
                  ].map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setInputValue(prompt);
                        textareaRef.current?.focus();
                      }}
                      className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-purple-300 transition-all text-left text-sm text-slate-700"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Messages
            <div className="max-w-3xl mx-auto p-6 space-y-6">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${
                      message.role === 'USER' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] ${
                        message.role === 'USER' ? 'order-2' : 'order-1'
                      }`}
                    >
                      {/* Message Bubble */}
                      <div
                        className={`rounded-2xl px-5 py-3.5 ${
                          message.role === 'USER'
                            ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg shadow-purple-500/20'
                            : 'bg-slate-50 text-slate-900 border border-slate-200'
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>

                      {/* Feedback for AI messages */}
                      {message.role === 'ASSISTANT' && (
                        <div className="flex items-center gap-3 mt-2 pl-2">
                          <span className="text-xs text-slate-500">Was this helpful?</span>
                          <button
                            onClick={() => handleRateMessage(message.id, true)}
                            className={`p-1.5 rounded-lg transition-all ${
                              message.wasHelpful === true
                                ? 'text-green-600 bg-green-50'
                                : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                            }`}
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRateMessage(message.id, false)}
                            className={`p-1.5 rounded-lg transition-all ${
                              message.wasHelpful === false
                                ? 'text-red-600 bg-red-50'
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                          >
                            <ThumbsDown className="w-4 h-4" />
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
                  <div className="max-w-[85%] bg-slate-50 text-slate-900 rounded-2xl px-5 py-3.5 border border-slate-200">
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {streamingMessage}
                      <span className="inline-block w-2 h-5 bg-purple-600 animate-pulse ml-1"></span>
                    </p>
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
                  <div className="bg-slate-50 rounded-2xl px-5 py-4 border border-slate-200">
                    <div className="flex gap-1.5">
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        {selectedConversation && (
          <div className="border-t border-slate-200 bg-white p-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask me anything..."
                    className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent max-h-32 overflow-y-auto"
                    rows={1}
                    disabled={isStreaming}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isStreaming}
                  className="p-3 bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Press Enter to send • Shift+Enter for new line
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
