/**
 * AI TUTOR PAGE - Student View
 * Lists all AI conversations and allows creating new ones
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { AITutorChat } from '../../components/ai/AITutorChat';
import { aiTAService } from '../../services/aiTA.service';

export const AITutorPage: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  // Fetch conversations
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: () => aiTAService.listConversations({ isActive: true }),
  });

  const conversations = data?.conversations || [];

  // Calculate stats
  const totalConversations = conversations.length;
  const totalMessages = conversations.reduce((sum, conv) => sum + conv.messageCount, 0);
  const totalConcepts = [...new Set(conversations.flatMap(c => c.conceptTags))].length;

  const handleNewConversation = async () => {
    try {
      const conversation = await aiTAService.createConversation({
        conversationType: 'GENERAL_HELP',
        title: 'General Help',
      });
      setSelectedConversation(conversation.id);
      setShowChat(true);
      refetch(); // Refresh conversation list
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">AI Tutor</h1>
          <p className="text-slate-600">Get personalized help with your assignments and concepts</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{isLoading ? '...' : totalConversations}</p>
                <p className="text-sm text-slate-600">Total Conversations</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{isLoading ? '...' : totalMessages}</p>
                <p className="text-sm text-slate-600">Total Messages</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{isLoading ? '...' : totalConcepts}</p>
                <p className="text-sm text-slate-600">Concepts Covered</p>
              </div>
            </div>
          </Card>
        </div>

        {/* New Conversation Button */}
        <div className="mb-6">
          <Button
            variant="primary"
            size="lg"
            onClick={handleNewConversation}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Start New Conversation
          </Button>
        </div>

        {/* Conversations List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800">Recent Conversations</h2>
          {conversations.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No Conversations Yet</h3>
                <p className="text-slate-600 mb-6">Start your first conversation with the AI Tutor to get personalized help!</p>
                <Button variant="primary" onClick={handleNewConversation}>
                  Get Started
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {conversations.map((conv) => (
                <Card key={conv.id} className="p-6 hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedConversation(conv.id);
                    setShowChat(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-800 mb-1">
                        {conv.title || conv.conversationType.replace('_', ' ')}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-slate-500 mb-2">
                        <span>{conv.messageCount} messages</span>
                        <span>•</span>
                        <span>{new Date(conv.updatedAt).toLocaleDateString()}</span>
                      </div>
                      {conv.conceptTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {conv.conceptTags.slice(0, 3).map((tag: string, i: number) => (
                            <span key={i} className="text-xs bg-blue-100 text-brand-blue px-2 py-1 rounded-full">
                              {tag}
                            </span>
                          ))}
                          {conv.conceptTags.length > 3 && (
                            <span className="text-xs text-slate-500">+{conv.conceptTags.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>
                    <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {selectedConversation && showChat && (
        <AITutorChat
          conversationId={selectedConversation}
          onClose={() => {
            setSelectedConversation(null);
            setShowChat(false);
            refetch(); // Refresh conversation list
          }}
        />
      )}
    </div>
  );
};
