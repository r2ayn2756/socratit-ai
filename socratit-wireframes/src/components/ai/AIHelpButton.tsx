/**
 * AI HELP BUTTON
 * Floating button for students to get AI help during assignments
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AITutorChat } from './AITutorChat';
import { aiTAService } from '../../services/aiTA.service';

interface AIHelpButtonProps {
  assignmentId: string;
  questionId?: string;
}

export const AIHelpButton: React.FC<AIHelpButtonProps> = ({ assignmentId, questionId }) => {
  const [showChat, setShowChat] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleGetHelp = async () => {
    // Create new conversation if needed
    if (!conversationId) {
      try {
        const conversation = await aiTAService.createConversation({
          assignmentId,
          conversationType: 'ASSIGNMENT_HELP',
        });
        setConversationId(conversation.id);
      } catch (error) {
        console.error('Error creating conversation:', error);
        alert('Failed to start AI conversation. Please try again.');
        return;
      }
    }

    setShowChat(true);
  };

  return (
    <>
      {/* Floating Help Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <motion.button
          onClick={handleGetHelp}
          className="w-16 h-16 bg-gradient-to-r from-brand-blue to-brand-purple text-white rounded-full shadow-2xl flex items-center justify-center hover:shadow-3xl transition-shadow"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </motion.button>

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-slate-800 text-white px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium shadow-xl"
            >
              Get AI Help
              <div className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-slate-800"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && conversationId && (
          <AITutorChat
            conversationId={conversationId}
            assignmentId={assignmentId}
            onClose={() => setShowChat(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
