// ============================================================================
// MODAL COMPONENT
// Apple-style modal/dialog with glass morphism and animations
// ============================================================================

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  footer?: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'lg',
  showCloseButton = true,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  footer,
  className = '',
}) => {
  // Size configurations
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw] h-[95vh]',
  };

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={closeOnOverlayClick ? onClose : undefined}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-describedby={subtitle ? 'modal-subtitle' : undefined}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
              }}
              className={`
                w-full ${sizeClasses[size]}
                ${size === 'full' ? 'h-full' : 'max-h-[90vh]'}
                pointer-events-auto
                ${className}
              `}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glass Card */}
              <div className="bg-white/90 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden h-full flex flex-col">
                {/* Header */}
                {(title || showCloseButton) && (
                  <div className="px-8 pt-8 pb-6 border-b border-gray-200/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {title && (
                          <h2 id="modal-title" className="text-3xl font-bold text-gray-900 mb-1">
                            {title}
                          </h2>
                        )}
                        {subtitle && (
                          <p id="modal-subtitle" className="text-base text-gray-600">
                            {subtitle}
                          </p>
                        )}
                      </div>

                      {showCloseButton && (
                        <button
                          onClick={onClose}
                          className="ml-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                          aria-label="Close modal"
                        >
                          <X className="w-5 h-5 text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-8 py-6">
                  {children}
                </div>

                {/* Footer */}
                {footer && (
                  <div className="px-8 py-6 border-t border-gray-200/50 bg-gray-50/50">
                    {footer}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// MODAL FOOTER COMPONENT (Helper)
// ============================================================================

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-end gap-3 ${className}`}>
      {children}
    </div>
  );
};

// ============================================================================
// CONFIRMATION MODAL (Specialized)
// ============================================================================

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  isLoading = false,
}) => {
  const variantStyles = {
    danger: 'bg-gradient-to-r from-red-500 to-red-600',
    warning: 'bg-gradient-to-r from-orange-500 to-orange-600',
    info: 'bg-gradient-to-r from-blue-500 to-blue-600',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={title}
      footer={
        <ModalFooter>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors duration-200 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`
              px-6 py-2.5 rounded-xl text-white font-medium
              ${variantStyles[variant]}
              hover:shadow-lg
              transition-all duration-200
              disabled:opacity-50
            `}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </ModalFooter>
      }
    >
      <p className="text-gray-700 leading-relaxed">
        {message}
      </p>
    </Modal>
  );
};

export default Modal;
