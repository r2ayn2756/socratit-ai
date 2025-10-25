import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  MessageSquare,
  Send,
  Search,
  User,
  Clock,
  CheckCheck,
  Bot,
  ChevronLeft,
  Loader,
} from 'lucide-react';
import messageService from '../../services/message.service';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const Messages: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: messageService.getUserConversations,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  // Fetch conversation history when a conversation is selected
  const { data: conversationHistory, isLoading: messagesLoading } = useQuery({
    queryKey: ['conversation', selectedUserId],
    queryFn: () => messageService.getConversation(selectedUserId!, 1, 50),
    enabled: !!selectedUserId,
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: messageService.getUnreadCount,
    refetchInterval: 5000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { recipientId: string; content: string }) =>
      messageService.sendDirectMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessageInput('');
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (messageId: string) => messageService.markMessageAsRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedUserId) {
      sendMessageMutation.mutate({
        recipientId: selectedUserId,
        content: messageInput.trim(),
      });
    }
  };

  const handleSelectConversation = (userId: string) => {
    setSelectedUserId(userId);
    // Mark messages as read
    const conversation = conversations.find(c => c.otherUser.id === userId);
    if (conversation && conversation.lastMessage && !conversation.lastMessage.isRead) {
      markAsReadMutation.mutate(conversation.lastMessage.id);
    }
  };

  const selectedConversation = conversations.find(c => c.otherUser.id === selectedUserId);

  const getUserAvatar = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return messageDate.toLocaleDateString();
  };

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-6">
        {/* Header */}
        <motion.div {...fadeInUp}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
              <p className="text-slate-600 mt-1">
                Communicate with your teachers
                {unreadCount > 0 && ` • ${unreadCount} unread`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Messages Interface */}
        <motion.div variants={staggerContainer} initial="initial" animate="animate">
          <Card className="p-0 overflow-hidden">
            <div className="flex h-[calc(100vh-240px)]">
              {/* Conversations List */}
              <div className="w-80 border-r border-slate-200 flex flex-col">
                {/* Search */}
                <div className="p-4 border-b border-slate-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto">
                  {conversationsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-slate-600">No conversations yet</p>
                      <p className="text-sm text-slate-400 mt-1">
                        Start chatting with your teachers
                      </p>
                    </div>
                  ) : (
                    conversations
                      .filter(conv =>
                        searchQuery
                          ? conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
                          : true
                      )
                      .map((conversation) => (
                        <button
                          key={conversation.otherUser.id}
                          onClick={() => handleSelectConversation(conversation.otherUser.id)}
                          className={`w-full p-4 text-left border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                            selectedUserId === conversation.otherUser.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                              {getUserAvatar(conversation.otherUser.name)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-slate-900 truncate">
                                  {conversation.otherUser.name}
                                </h3>
                                <span className="text-xs text-slate-500 ml-2">
                                  {formatTimestamp(conversation.lastMessage.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600 truncate">
                                {conversation.lastMessage.content}
                              </p>
                              {conversation.unreadCount > 0 && (
                                <Badge variant="primary" className="mt-2">
                                  {conversation.unreadCount} new
                                </Badge>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                  )}
                </div>
              </div>

              {/* Message Area */}
              <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Conversation Header */}
                    <div className="p-4 border-b border-slate-200 flex items-center gap-3">
                      <button
                        onClick={() => setSelectedUserId(null)}
                        className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                        {getUserAvatar(selectedConversation.otherUser.name)}
                      </div>
                      <div>
                        <h2 className="font-semibold text-slate-900">
                          {selectedConversation.otherUser.name}
                        </h2>
                        <p className="text-sm text-slate-500">
                          {selectedConversation.otherUser.role}
                        </p>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messagesLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                      ) : conversationHistory?.messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-slate-500">No messages yet</p>
                        </div>
                      ) : (
                        conversationHistory?.messages.map((message) => {
                          const isCurrentUser = message.senderId !== selectedUserId;
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-md px-4 py-2 rounded-lg ${
                                  isCurrentUser
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-slate-100 text-slate-900'
                                }`}
                              >
                                <p>{message.content}</p>
                                <div
                                  className={`flex items-center gap-1 mt-1 text-xs ${
                                    isCurrentUser ? 'text-blue-100' : 'text-slate-500'
                                  }`}
                                >
                                  <Clock className="w-3 h-3" />
                                  <span>{formatTimestamp(message.createdAt)}</span>
                                  {isCurrentUser && message.isRead && (
                                    <CheckCheck className="w-3 h-3 ml-1" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-slate-200">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type your message..."
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={sendMessageMutation.isPending}
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!messageInput.trim() || sendMessageMutation.isPending}
                          leftIcon={
                            sendMessageMutation.isPending ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )
                          }
                        >
                          Send
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Select a conversation
                      </h3>
                      <p className="text-slate-500">
                        Choose a conversation from the list to start messaging
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};
