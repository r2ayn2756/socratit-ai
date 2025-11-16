// ============================================================================
// CLASS MESSAGING SECTION COMPONENT
// Displays class announcements and provides messaging interface
// ============================================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Loader, Clock, Users, Megaphone } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CollapsibleSection } from './CollapsibleSection';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import messageService, { type Message } from '../../services/message.service';
import { useLanguage } from '../../contexts/LanguageContext';

interface ClassMessagingSectionProps {
  classId: string;
  className: string;
}

export const ClassMessagingSection: React.FC<ClassMessagingSectionProps> = ({
  classId,
  className,
}) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [messageInput, setMessageInput] = useState('');
  const [subjectInput, setSubjectInput] = useState('');
  const [showMessageForm, setShowMessageForm] = useState(false);

  // Fetch class messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['classMessages', classId],
    queryFn: () => messageService.getClassMessages(classId),
    refetchInterval: 15000, // Poll every 15 seconds
  });

  // Send class message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { content: string; subject?: string }) =>
      messageService.sendClassMessage(classId, {
        content: data.content,
        subject: data.subject,
        messageType: 'CLASS_ANNOUNCEMENT',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classMessages', classId] });
      setMessageInput('');
      setSubjectInput('');
      setShowMessageForm(false);
    },
  });

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessageMutation.mutate({
        content: messageInput.trim(),
        subject: subjectInput.trim() || undefined,
      });
    }
  };

  const formatTimestamp = (date: Date | string) => {
    const messageDate = new Date(date);
    const now = new Date();
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
    <CollapsibleSection
      title="Class Announcements"
      subtitle={`${messages.length} ${messages.length === 1 ? 'announcement' : 'announcements'}`}
      icon={<Megaphone className="w-5 h-5 text-white" />}
      defaultExpanded={true}
      action={
        !showMessageForm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMessageForm(true)}
            icon={<MessageSquare className="w-4 h-4" />}
          >
            New Announcement
          </Button>
        )
      }
    >
      <div className="space-y-4">
        {/* Message Form */}
        {showMessageForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <h4 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              Send Announcement to {className}
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Subject (Optional)
                </label>
                <input
                  type="text"
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  placeholder="Announcement subject..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={sendMessageMutation.isPending}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Message
                </label>
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your announcement to the entire class..."
                  rows={4}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={sendMessageMutation.isPending}
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Users className="w-4 h-4" />
                <span>This will be sent to all students in this class</span>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowMessageForm(false);
                    setMessageInput('');
                    setSubjectInput('');
                  }}
                  disabled={sendMessageMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
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
                  Send Announcement
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Messages List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No Announcements Yet"
            message="Send your first announcement to communicate with the entire class."
            action={{
              label: 'Send First Announcement',
              onClick: () => setShowMessageForm(true),
              icon: MessageSquare,
            }}
          />
        ) : (
          <div className="space-y-2">
            {messages.slice(0, 5).map((message: Message, index: number) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-lg bg-white/70 border border-neutral-200 hover:border-primary-300 transition-colors"
              >
                {/* Message Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                      {message.sender.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 text-sm">
                        {message.sender.name}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-neutral-600">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimestamp(message.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-md">
                    Announcement
                  </div>
                </div>

                {/* Message Subject */}
                {message.subject && (
                  <h4 className="font-semibold text-neutral-900 mb-1">
                    {message.subject}
                  </h4>
                )}

                {/* Message Content */}
                <p className="text-neutral-700 text-sm whitespace-pre-wrap">
                  {message.content}
                </p>
              </motion.div>
            ))}

            {/* View All Link */}
            {messages.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="ghost" size="sm">
                  View all {messages.length} announcements →
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};

export default ClassMessagingSection;
