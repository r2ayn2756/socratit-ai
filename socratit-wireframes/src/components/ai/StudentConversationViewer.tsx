/**
 * STUDENT CONVERSATION VIEWER
 * Teacher-only component to view student AI conversations
 * Read-only interface for monitoring and understanding student struggles
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '../common/Badge';
import { aiTAService } from '../../services/aiTA.service';
import {
  X,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Clock,
  Calendar,
} from 'lucide-react';

interface StudentConversationViewerProps {
  studentId: string;
  studentName: string;
  assignmentId?: string;
  onClose: () => void;
}

export const StudentConversationViewer: React.FC<StudentConversationViewerProps> = ({
  studentId,
  studentName,
  assignmentId,
  onClose,
}) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Fetch student's conversations
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['student-conversations', studentId, assignmentId],
    queryFn: () => aiTAService.getStudentConversations(studentId, assignmentId),
  });

  const conversations = conversationsData?.conversations || [];

  // Fetch selected conversation details
  const { data: conversationDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['conversation-details', selectedConversationId],
    queryFn: () => aiTAService.getConversation(selectedConversationId!),
    enabled: !!selectedConversationId,
  });

  // Calculate struggle indicators
  const getStruggleIndicators = (conversation: any) => {
    const indicators = [];

    if (conversation.messageCount > 15) {
      indicators.push({ type: 'warning', text: 'Long conversation (15+ messages)' });
    }

    const negativeRatings = conversationDetails?.messages.filter(
      (m: any) => m.role === 'ASSISTANT' && m.wasHelpful === false
    ).length || 0;

    if (negativeRatings >= 2) {
      indicators.push({ type: 'danger', text: `${negativeRatings} unhelpful responses` });
    }

    if (conversation.conceptTags.length > 5) {
      indicators.push({ type: 'info', text: 'Multiple concepts explored' });
    }

    return indicators;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-blue to-brand-purple p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">AI Conversations</h2>
              <p className="text-white text-opacity-80">
                {studentName}
                {assignmentId && ' • Filtered by assignment'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-80 border-r border-slate-200 overflow-y-auto bg-slate-50">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Conversations ({conversations.length})
              </h3>

              {conversationsLoading && (
                <div className="text-center py-8 text-slate-600">
                  Loading conversations...
                </div>
              )}

              {!conversationsLoading && conversations.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 text-sm">No conversations found</p>
                </div>
              )}

              <div className="space-y-2">
                {conversations.map((conv: any) => {
                  const isSelected = selectedConversationId === conv.id;
                  const indicators = getStruggleIndicators(conv);

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversationId(conv.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        isSelected
                          ? 'bg-blue-100 border-2 border-brand-blue'
                          : 'bg-white hover:bg-slate-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-sm text-slate-800 line-clamp-1">
                          {conv.title || conv.conversationType.replace('_', ' ')}
                        </span>
                        {conv.isSharedWithTeacher && (
                          <Badge variant="primary" size="sm">Shared</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <Clock className="w-3 h-3" />
                        {formatDate(conv.createdAt)}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-600 mb-2">
                        <span>{conv.messageCount} messages</span>
                        {conv.conceptTags.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{conv.conceptTags.length} concepts</span>
                          </>
                        )}
                      </div>

                      {indicators.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {indicators.map((indicator, i) => (
                            <span
                              key={i}
                              className={`text-xs px-2 py-1 rounded-full ${
                                indicator.type === 'danger'
                                  ? 'bg-red-100 text-red-700'
                                  : indicator.type === 'warning'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {indicator.text}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Conversation Details */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!selectedConversationId ? (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p>Select a conversation to view details</p>
                </div>
              </div>
            ) : detailsLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-slate-600">Loading conversation...</div>
              </div>
            ) : conversationDetails ? (
              <>
                {/* Conversation Header */}
                <div className="p-6 border-b border-slate-200 bg-white">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-1">
                        {conversationDetails.title || conversationDetails.conversationType.replace('_', ' ')}
                      </h3>
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Started {formatDate(conversationDetails.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant={conversationDetails.isActive ? 'success' : 'neutral'}
                      size="lg"
                    >
                      {conversationDetails.isActive ? 'Active' : 'Closed'}
                    </Badge>
                  </div>

                  {/* Concept Tags */}
                  {conversationDetails.conceptTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {conversationDetails.conceptTags.map((tag: string, i: number) => (
                        <Badge key={i} variant="neutral" size="sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                  <AnimatePresence>
                    {conversationDetails.messages.map((message: any, index: number) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.role === 'USER' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${message.role === 'USER' ? 'order-2' : 'order-1'}`}>
                          {/* Role Label */}
                          <div className={`text-xs font-medium mb-1 ${
                            message.role === 'USER' ? 'text-right text-blue-600' : 'text-left text-slate-600'
                          }`}>
                            {message.role === 'USER' ? 'Student' : 'AI Assistant'}
                          </div>

                          {/* Message Bubble */}
                          <div
                            className={`rounded-2xl px-5 py-3 ${
                              message.role === 'USER'
                                ? 'bg-brand-blue text-white shadow-lg shadow-blue-500/20'
                                : 'bg-white text-slate-800 shadow-lg border border-slate-200'
                            }`}
                          >
                            <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          </div>

                          {/* Message Metadata */}
                          <div className={`flex items-center gap-2 mt-1 text-xs text-slate-500 ${
                            message.role === 'USER' ? 'justify-end' : 'justify-start'
                          }`}>
                            <span>{formatDate(message.createdAt)}</span>

                            {/* Helpfulness Rating */}
                            {message.role === 'ASSISTANT' && message.wasHelpful !== null && (
                              <>
                                <span>•</span>
                                {message.wasHelpful ? (
                                  <span className="flex items-center gap-1 text-green-600">
                                    <ThumbsUp className="w-3 h-3" />
                                    Helpful
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-red-600">
                                    <ThumbsDown className="w-3 h-3" />
                                    Not Helpful
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Analysis Footer */}
                <div className="p-4 border-t border-slate-200 bg-blue-50">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-brand-blue flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-slate-800 mb-1">Teaching Insight</p>
                      <p className="text-slate-600">
                        This conversation shows the student exploring {conversationDetails.conceptTags.length} concept(s)
                        over {conversationDetails.messageCount} messages.
                        {conversationDetails.messages.filter((m: any) => m.role === 'ASSISTANT' && m.wasHelpful === false).length > 0 && (
                          <span className="text-orange-600 font-medium">
                            {' '}The student marked some responses as unhelpful, indicating they may need alternative explanations.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
