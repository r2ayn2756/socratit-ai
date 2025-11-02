// ============================================================================
// COLLAPSIBLE SECTION COMPONENT
// Reusable collapsible section for class dashboard
// ============================================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  action?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  subtitle,
  icon,
  children,
  defaultExpanded = false,
  action,
  className = '',
  headerClassName = '',
  contentClassName = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const sectionId = `collapsible-${title.toLowerCase().replace(/\s+/g, '-')}`;
  const contentId = `${sectionId}-content`;

  return (
    <div className={`bg-white/80 backdrop-blur-xl border border-neutral-200/50 rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-full px-6 py-4 flex items-center gap-4
          hover:bg-neutral-50/50 transition-colors duration-200
          ${headerClassName}
        `}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${title}`}
      >
        {/* Icon */}
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}

        {/* Title & Subtitle */}
        <div className="flex-1 text-left">
          <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-neutral-600 mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Action Button */}
        {action && (
          <div onClick={(e) => e.stopPropagation()}>
            {action}
          </div>
        )}

        {/* Expand/Collapse Icon */}
        <motion.div
          animate={{ rotate: isExpanded ? 0 : -90 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="text-neutral-400"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div
              id={contentId}
              role="region"
              aria-labelledby={sectionId}
              className={`px-6 pb-6 border-t border-neutral-200/50 ${contentClassName}`}
            >
              <div className="pt-4">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// SIMPLE COLLAPSIBLE (Minimal Version)
// ============================================================================

interface SimpleCollapsibleProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export const SimpleCollapsible: React.FC<SimpleCollapsibleProps> = ({
  trigger,
  children,
  defaultExpanded = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={className}>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer select-none"
      >
        {trigger}
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollapsibleSection;
