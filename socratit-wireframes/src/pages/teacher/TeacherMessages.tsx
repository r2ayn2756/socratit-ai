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
  Users,
  User,
  Clock,
  CheckCheck,
  ChevronLeft,
  Loader,
} from 'lucide-react';
import messageService from '../../services/message.service';
import classService from '../../services/class.service';

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

export const TeacherMessages: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showClassMessageModal, setShowClassMessageModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classMessageContent, setClassMessageContent] = useState('');
  const [classMessageSubject, setClassMessageSubject] = useState('');

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: messageService.getUserConversations,
    refetchInterval: 15000, // Poll every 15 seconds (reduced from 5s to prevent rate limits)
  });

  // Fetch teacher's classes for class messaging
  const { data: classes = [] } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => classService.getTeacherClasses(),
  });

  // Fetch conversation history
  const { data: conversationHistory, isLoading: messagesLoading } = useQuery({
    queryKey: ['conversation', selectedUserId],
    queryFn: () => messageService.getConversation(selectedUserId!, 1, 50),
    enabled: !!selectedUserId,
    refetchInterval: 10000, // Poll every 10 seconds (reduced from 3s to prevent rate limits)
  });

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: messageService.getUnreadCount,
    refetchInterval: 15000, // Poll every 15 seconds (reduced from 5s to prevent rate limits)
  });

  // Send direct message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { recipientId: string; content: string }) =>
      messageService.sendDirectMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessageInput('');
    },
  });

  // Send class message mutation
  const sendClassMessageMutation = useMutation({
    mutationFn: (data: { classId: string; content: string; subject?: string }) =>
      messageService.sendClassMessage(data.classId, {
        content: data.content,
        subject: data.subject,
        messageType: 'ANNOUNCEMENT',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setShowClassMessageModal(false);
      setClassMessageContent('');
      setClassMessageSubject('');
      setSelectedClassId('');
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

  const handleSendClassMessage = () => {
    if (classMessageContent.trim() && selectedClassId) {
      sendClassMessageMutation.mutate({
        classId: selectedClassId,
        content: classMessageContent.trim(),
        subject: classMessageSubject.trim() || undefined,
      });
    }
  };

  const handleSelectConversation = (userId: string) => {
    setSelectedUserId(userId);
    const conversation = conversations.find(c => c.otherUser.id === userId);
    if (conversation && conversation.lastMessage && !conversation.lastMessage.isRead) {
      markAsReadMutation.mutate(conversation.lastMessage.id);
    }
  };

  const selectedConversation = conversations.find(c => c.otherUser.id === selectedUserId);

  const getUserAvatar = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
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
    <DashboardLayout userRole="teacher">
      <div className="space-y-6">
        {/* Header */}
        <motion.div {...fadeInUp}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
              <p className="text-slate-600 mt-1">
                Communicate with students
                {unreadCount > 0 && ` • ${unreadCount} unread`}
              </p>
            </div>
            <Button
              onClick={() => setShowClassMessageModal(true)}
              icon={<Users className="w-4 h-4" />}
            >
              Message Class
            </Button>
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
                        Start chatting with your students
                      </p>
                    </div>
                  ) : (
                    conversations
                      .filter(conv =>
                        searchQuery
                          ? `${conv.otherUser.firstName} ${conv.otherUser.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
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
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                              {getUserAvatar(conversation.otherUser.firstName, conversation.otherUser.lastName)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-slate-900 truncate">
                                  {conversation.otherUser.firstName} {conversation.otherUser.lastName}
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
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {getUserAvatar(selectedConversation.otherUser.firstName, selectedConversation.otherUser.lastName)}
                      </div>
                      <div>
                        <h2 className="font-semibold text-slate-900">
                          {selectedConversation.otherUser.firstName} {selectedConversation.otherUser.lastName}
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
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-slate-100 text-slate-900'
                                }`}
                              >
                                <p>{message.content}</p>
                                <div
                                  className={`flex items-center gap-1 mt-1 text-xs ${
                                    isCurrentUser ? 'text-purple-100' : 'text-slate-500'
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
                          icon={
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

        {/* Class Message Modal */}
        {showClassMessageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Send Class Message</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Select Class
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-4 py-2 bg-white/90 backdrop-blur-md border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a class...</option>
                    {classes.map((cls: any) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} - {cls.subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Subject (Optional)
                  </label>
                  <input
                    type="text"
                    value={classMessageSubject}
                    onChange={(e) => setClassMessageSubject(e.target.value)}
                    placeholder="Message subject..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={classMessageContent}
                    onChange={(e) => setClassMessageContent(e.target.value)}
                    placeholder="Type your message to the entire class..."
                    rows={6}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowClassMessageModal(false);
                    setClassMessageContent('');
                    setClassMessageSubject('');
                    setSelectedClassId('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendClassMessage}
                  disabled={!classMessageContent.trim() || !selectedClassId || sendClassMessageMutation.isPending}
                  icon={
                    sendClassMessageMutation.isPending ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )
                  }
                >
                  Send to Class
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
