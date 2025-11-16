/**
 * TEACHER CHATGPT-STYLE CHAT PAGE
 * Full-screen ChatGPT-style interface for teacher AI conversations
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
  Menu,
  X,
  Copy,
  Check,
  Trash2,
  MoreVertical,
  Search,
  Clock,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { aiTAService } from '../../services/aiTA.service';
import { websocketService } from '../../services/websocket.service';
import { Button } from '../../components/common/Button';
import { DashboardLayout } from '../../components/layout';

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

export const TeacherChatPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // DEBUG: Log that this is the TEACHER chat page
  useEffect(() => {
    console.log('🎓 TEACHER CHAT PAGE LOADED - This should show teacher navigation');
    console.log('📍 Current path:', location.pathname);
  }, []);

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hasAutoSent, setHasAutoSent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showConvOptions, setShowConvOptions] = useState<string | null>(null);
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

  // Filter conversations based on search
  const filteredConversations = conversations.filter((conv) =>
    (conv.title || 'Untitled Conversation')
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

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
        console.log('📥 Loading conversation:', selectedConversation);
        const data = await aiTAService.getConversation(selectedConversation);
        console.log('📥 Loaded messages:', data.messages.length);
        setMessages(
          data.messages.map((msg: any) => ({
            ...msg,
            createdAt: new Date(msg.createdAt),
          }))
        );
      } catch (error) {
        console.error('❌ Error loading conversation:', error);
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
      onComplete: async (fullResponse: string) => {
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

        // Refetch conversation list to update message count
        refetch();

        // Reload conversation to ensure we have all messages from backend
        try {
          const data = await aiTAService.getConversation(selectedConversation!);
          console.log('🔄 Reloaded conversation after message, total messages:', data.messages.length);
          setMessages(
            data.messages.map((msg: any) => ({
              ...msg,
              createdAt: new Date(msg.createdAt),
            }))
          );
        } catch (error) {
          console.error('❌ Error reloading conversation:', error);
        }
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
      console.log('🎓 TEACHER attempting to create conversation...');
      console.log('🔑 Auth token:', localStorage.getItem('authToken')?.substring(0, 20) + '...');

      const conversation = await aiTAService.createConversation({
        conversationType: 'GENERAL_HELP',
        title: 'New Conversation',
      });

      console.log('✅ Conversation created successfully:', conversation.id);
      setSelectedConversation(conversation.id);
      setMessages([]);
      setStreamingMessage('');
      setHasAutoSent(false);
      refetch();
    } catch (error: any) {
      console.error('❌ Error creating conversation:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error message:', error.message);

      const errorMsg = error.response?.data?.message || error.message || 'Failed to start conversation';
      alert(`Failed to start conversation: ${errorMsg}\n\nStatus: ${error.response?.status || 'unknown'}`);
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

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    if (window.confirm('Delete this conversation? This cannot be undone.')) {
      try {
        await aiTAService.closeConversation(convId);
        if (selectedConversation === convId) {
          setSelectedConversation(null);
          setMessages([]);
        }
        refetch();
      } catch (error) {
        console.error('Error deleting conversation:', error);
        alert('Failed to delete conversation. Please try again.');
      }
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('conversation-search')?.focus();
      }
      // Cmd/Ctrl + / to toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <DashboardLayout userRole="teacher">
      <div className="flex h-full -m-6 overflow-hidden bg-white">
        {/* Sidebar - Conversation History */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden"
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-slate-200 space-y-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleNewConversation}
                  className="w-full justify-start gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Conversation
                </Button>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="conversation-search"
                    type="text"
                    placeholder="Search... (Ctrl+K)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {isLoading ? (
                  <div className="text-slate-500 text-sm text-center py-8">Loading...</div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-slate-500 text-sm text-center py-8">
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div key={conv.id} className="relative group">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedConversation(conv.id);
                          setMessages([]);
                          setStreamingMessage('');
                          setHasAutoSent(false);
                          setShowConvOptions(null);
                        }}
                        className={`w-full text-left px-3 py-3 rounded-lg transition-all ${
                          selectedConversation === conv.id
                            ? 'bg-purple-100 border border-purple-200 text-slate-900'
                            : 'text-slate-700 hover:bg-slate-100 border border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-2 pr-6">
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

                      {/* Options Menu */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowConvOptions(showConvOptions === conv.id ? null : conv.id);
                        }}
                        className="absolute right-2 top-3 p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-200 rounded transition-all"
                      >
                        <MoreVertical className="w-4 h-4 text-slate-600" />
                      </button>

                      {showConvOptions === conv.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute right-2 top-10 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 min-w-[140px]"
                        >
                          <button
                            onClick={() => {
                              handleDeleteConversation(conv.id);
                              setShowConvOptions(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </motion.div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Top Header */}
          <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title={sidebarOpen ? 'Close sidebar (Ctrl+/)' : 'Open sidebar (Ctrl+/)'}
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5 text-slate-600" />
                ) : (
                  <Menu className="w-5 h-5 text-slate-600" />
                )}
              </button>
              <img
                src="/logo512.png"
                alt="SocratIt"
                className="h-10 w-auto object-contain"
              />
            </div>
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
                    className="mb-8"
                  >
                    <img
                      src="/logo512.png"
                      alt="SocratIt Logo"
                      className="w-32 h-32 object-contain mx-auto mb-6"
                    />
                  </motion.div>
                  <h2 className="text-4xl font-bold text-slate-900 mb-4">
                    Hi, I'm SocratIt
                  </h2>
                  <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                    Your AI assistant for lesson planning, curriculum design, and teaching support.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto mb-8">
                    {[
                      {
                        title: 'Lesson Planning',
                        description: 'Get help creating engaging lesson plans',
                        icon: '📚',
                      },
                      {
                        title: 'Assignment Ideas',
                        description: 'Generate creative assignment concepts',
                        icon: '✏️',
                      },
                      {
                        title: 'Teaching Strategies',
                        description: 'Discover effective teaching methods',
                        icon: '🎯',
                      },
                      {
                        title: 'Always Available',
                        description: 'Plan on your schedule, day or night',
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
                  <img
                    src="/logo512.png"
                    alt="SocratIt Logo"
                    className="w-20 h-20 object-contain mx-auto mb-4"
                  />
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    Ready to help!
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Ask me anything about lesson planning, curriculum design, or teaching strategies.
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      'Help me create a lesson plan for algebra',
                      'What are effective classroom management strategies?',
                      'Generate quiz questions for American History',
                      'How can I engage struggling students?',
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
                        <div className="group relative">
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

                          {/* Copy button */}
                          <button
                            onClick={() => handleCopyMessage(message.content, message.id)}
                            className={`absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                              message.role === 'USER'
                                ? 'bg-white/20 hover:bg-white/30 text-white'
                                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                            }`}
                            title="Copy message"
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {/* Timestamp and Feedback */}
                        <div className="flex items-center gap-3 mt-2 pl-2">
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(message.createdAt)}
                          </div>

                          {message.role === 'ASSISTANT' && (
                            <>
                              <span className="text-slate-300">•</span>
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
    </DashboardLayout>
  );
};
