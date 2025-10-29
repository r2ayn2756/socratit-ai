// ============================================================================
// AI CHAT ASSISTANT COMPONENT
// Chat interface for refining curriculum schedules with AI
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { GlassCard, GlassPanel } from './GlassCard';
import { Button, IconButton } from './Button';
import type { ConversationMessage, AIRefinementResponse } from '../../types/curriculum.types';
import curriculumApi from '../../services/curriculumApi.service';
import { format } from 'date-fns';

interface AIChatAssistantProps {
  scheduleId: string;
  onScheduleUpdated?: () => void;
  className?: string;
}

export const AIChatAssistant: React.FC<AIChatAssistantProps> = ({
  scheduleId,
  onScheduleUpdated,
  className = '',
}) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI curriculum assistant. I can help you refine your schedule, adjust pacing, reorganize units, or answer questions about your curriculum plan. What would you like to do?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<AIRefinementResponse['suggestedChanges']>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Get conversation history (last 10 messages)
      const conversationHistory = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call AI API
      const response = await curriculumApi.schedules.refineScheduleWithAI(
        scheduleId,
        {
          message: inputValue,
          conversationHistory,
        }
      );

      // Add AI response
      const aiMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        suggestions: response.suggestedChanges,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Store pending changes
      if (response.suggestedChanges && response.suggestedChanges.length > 0) {
        setPendingChanges(response.suggestedChanges);
      }
    } catch (error) {
      console.error('AI chat error:', error);

      const errorMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleApplyChanges = async () => {
    if (pendingChanges.length === 0) return;

    // Apply changes via API
    // Implementation depends on backend endpoint
    setPendingChanges([]);
    onScheduleUpdated?.();
  };

  const handleRejectChanges = () => {
    setPendingChanges([]);
  };

  return (
    <GlassPanel
      title="AI Assistant"
      subtitle="Chat with AI to refine your schedule"
      className={className}
    >
      {/* Messages Container */}
      <div className="h-[500px] overflow-y-auto mb-4 space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[80%] rounded-2xl px-4 py-3
                  ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/70 backdrop-blur-xl border border-white/20 text-gray-900'
                  }
                `}
              >
                {/* Message Header */}
                <div className="flex items-center gap-2 mb-1">
                  {message.role === 'assistant' && (
                    <Sparkles className="w-4 h-4 text-blue-500" />
                  )}
                  <span className="text-xs opacity-70">
                    {format(message.timestamp, 'h:mm a')}
                  </span>
                </div>

                {/* Message Content */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>

                {/* Suggested Changes */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200/50 space-y-2">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Suggested Changes:
                    </p>
                    {message.suggestions.map((change, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-white/50 rounded-lg p-2 space-y-1"
                      >
                        <p className="font-medium text-gray-900">
                          {change.unitTitle}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">{change.field}:</span>{' '}
                          <span className="line-through">{String(change.currentValue)}</span>
                          {' → '}
                          <span className="text-blue-600 font-medium">
                            {String(change.suggestedValue)}
                          </span>
                        </p>
                        <p className="text-gray-500 italic">{change.reasoning}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pending Changes Action Bar */}
      <AnimatePresence>
        {pendingChanges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4"
          >
            <GlassCard variant="elevated" padding="md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {pendingChanges.length} suggested change{pendingChanges.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-600">
                      Review and apply or reject these changes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <IconButton
                    icon={<XCircle className="w-5 h-5" />}
                    variant="ghost"
                    onClick={handleRejectChanges}
                    tooltip="Reject changes"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<CheckCircle className="w-4 h-4" />}
                    onClick={handleApplyChanges}
                  >
                    Apply Changes
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="relative">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about your curriculum schedule..."
          disabled={isLoading}
          rows={3}
          className="
            w-full px-4 py-3 pr-12
            bg-white/70 backdrop-blur-xl
            border border-white/20
            rounded-xl
            text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500/50
            resize-none
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        />

        {/* Send Button */}
        <IconButton
          icon={<Send className="w-5 h-5" />}
          variant="primary"
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
          className="absolute right-2 bottom-2"
          tooltip="Send message (Enter)"
        />
      </div>

      {/* Quick Suggestions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          'Adjust pacing for struggling students',
          'Add a review unit before finals',
          'Move challenging topics to later',
          'Suggest project-based units',
        ].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => setInputValue(suggestion)}
            disabled={isLoading}
            className="
              px-3 py-1.5
              bg-white/50 backdrop-blur-sm
              border border-white/20
              rounded-full
              text-xs text-gray-700
              hover:bg-white/70 hover:border-blue-300
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {suggestion}
          </button>
        ))}
      </div>
    </GlassPanel>
  );
};

export default AIChatAssistant;
