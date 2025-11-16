// ============================================================================
// TEST LOCKDOWN COMPONENT
// Security features for test assignments - tab switch detection, copy/paste prevention
// ============================================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Eye, EyeOff, Shield, X } from 'lucide-react';
import { Button, Card } from '../common';

// ============================================================================
// TYPES
// ============================================================================

export interface LockdownSettings {
  enableTabSwitchDetection: boolean;
  enableCopyPasteBlocking: boolean;
  enableFullscreen: boolean;
  maxViolations?: number;
  autoSubmitOnMaxViolations?: boolean;
}

export interface LockdownViolation {
  type: 'TAB_SWITCH' | 'COPY_ATTEMPT' | 'PASTE_ATTEMPT' | 'FULLSCREEN_EXIT';
  timestamp: Date;
  message: string;
}

interface TestLockdownProps {
  enabled: boolean;
  settings: LockdownSettings;
  assignmentId: string;
  onViolation?: (violation: LockdownViolation) => void;
  onMaxViolationsReached?: () => void;
  children: React.ReactNode;
}

// ============================================================================
// TEST LOCKDOWN COMPONENT
// ============================================================================

export const TestLockdown: React.FC<TestLockdownProps> = ({
  enabled,
  settings,
  assignmentId,
  onViolation,
  onMaxViolationsReached,
  children,
}) => {
  const [violations, setViolations] = useState<LockdownViolation[]>([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [lastViolation, setLastViolation] = useState<LockdownViolation | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRequested = useRef(false);

  // ========================================
  // VIOLATION LOGGING
  // ========================================

  const logViolation = useCallback((violation: LockdownViolation) => {
    console.log('[TEST LOCKDOWN] Violation detected:', violation);

    setViolations(prev => [...prev, violation]);
    setLastViolation(violation);
    setShowWarningModal(true);

    // Call parent handler
    if (onViolation) {
      onViolation(violation);
    }

    // Check if max violations reached
    if (settings.maxViolations && violations.length + 1 >= settings.maxViolations) {
      if (settings.autoSubmitOnMaxViolations && onMaxViolationsReached) {
        onMaxViolationsReached();
      }
    }
  }, [violations.length, settings, onViolation, onMaxViolationsReached]);

  // ========================================
  // TAB SWITCH DETECTION
  // ========================================

  useEffect(() => {
    if (!enabled || !settings.enableTabSwitchDetection) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched away from tab
        const violation: LockdownViolation = {
          type: 'TAB_SWITCH',
          timestamp: new Date(),
          message: 'You switched to another tab or window.',
        };
        logViolation(violation);
      }
    };

    const handleBlur = () => {
      // Window lost focus
      const violation: LockdownViolation = {
        type: 'TAB_SWITCH',
        timestamp: new Date(),
        message: 'You left the test window.',
      };
      logViolation(violation);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled, settings.enableTabSwitchDetection, logViolation]);

  // ========================================
  // COPY/PASTE PREVENTION
  // ========================================

  useEffect(() => {
    if (!enabled || !settings.enableCopyPasteBlocking) return;

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      const violation: LockdownViolation = {
        type: 'COPY_ATTEMPT',
        timestamp: new Date(),
        message: 'Copying text is not allowed during this test.',
      };
      logViolation(violation);
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      const violation: LockdownViolation = {
        type: 'PASTE_ATTEMPT',
        timestamp: new Date(),
        message: 'Pasting text is not allowed during this test.',
      };
      logViolation(violation);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+C, Ctrl+V, Ctrl+X
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        const type = e.key.toLowerCase() === 'v' ? 'PASTE_ATTEMPT' : 'COPY_ATTEMPT';
        const violation: LockdownViolation = {
          type,
          timestamp: new Date(),
          message: type === 'PASTE_ATTEMPT'
            ? 'Pasting is not allowed during this test.'
            : 'Copying is not allowed during this test.',
        };
        logViolation(violation);
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, settings.enableCopyPasteBlocking, logViolation]);

  // ========================================
  // FULLSCREEN MODE
  // ========================================

  const requestFullscreen = useCallback(() => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen().catch(err => {
        console.error('Failed to enter fullscreen:', err);
      });
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    if (!enabled || !settings.enableFullscreen) return;

    // Request fullscreen when lockdown starts
    if (!fullscreenRequested.current) {
      requestFullscreen();
      fullscreenRequested.current = true;
    }

    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);

      // Log violation if user exits fullscreen
      if (!isNowFullscreen && fullscreenRequested.current) {
        const violation: LockdownViolation = {
          type: 'FULLSCREEN_EXIT',
          timestamp: new Date(),
          message: 'You exited fullscreen mode.',
        };
        logViolation(violation);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      // Exit fullscreen when component unmounts
      exitFullscreen();
    };
  }, [enabled, settings.enableFullscreen, requestFullscreen, exitFullscreen, logViolation]);

  // ========================================
  // RENDER
  // ========================================

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Lockdown Status Indicator */}
      <div className="fixed top-4 right-4 z-50">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
        >
          <Shield className="w-5 h-5" />
          <div>
            <div className="font-semibold text-sm">Test Lockdown Active</div>
            <div className="text-xs opacity-90">
              {violations.length} violation{violations.length !== 1 ? 's' : ''}
              {settings.maxViolations && ` / ${settings.maxViolations} max`}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Warning Modal */}
      <AnimatePresence>
        {showWarningModal && lastViolation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-md w-full mx-4"
            >
              <Card>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Security Warning
                  </h2>
                  <p className="text-slate-700 mb-4">{lastViolation.message}</p>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> All security violations are being logged and will be reported to your teacher.
                    </p>
                  </div>

                  {settings.maxViolations && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-600">
                        Violations: <strong>{violations.length} / {settings.maxViolations}</strong>
                      </p>
                      {settings.autoSubmitOnMaxViolations && (
                        <p className="text-xs text-red-600 mt-1">
                          Your test will be automatically submitted if you reach {settings.maxViolations} violations.
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    variant="primary"
                    onClick={() => setShowWarningModal(false)}
                    className="w-full"
                  >
                    I Understand, Continue Test
                  </Button>

                  {settings.enableFullscreen && !isFullscreen && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        requestFullscreen();
                        setShowWarningModal(false);
                      }}
                      className="w-full mt-2"
                    >
                      Return to Fullscreen
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div
        className="select-none"
        style={{ userSelect: settings.enableCopyPasteBlocking ? 'none' : 'auto' }}
      >
        {children}
      </div>
    </div>
  );
};

// ============================================================================
// LOCKDOWN INFO BANNER
// Display lockdown info before test starts
// ============================================================================

interface LockdownInfoBannerProps {
  settings: LockdownSettings;
  onAccept: () => void;
}

export const LockdownInfoBanner: React.FC<LockdownInfoBannerProps> = ({
  settings,
  onAccept,
}) => {
  const features = [];
  if (settings.enableTabSwitchDetection) features.push('Tab switch monitoring');
  if (settings.enableCopyPasteBlocking) features.push('Copy/paste blocking');
  if (settings.enableFullscreen) features.push('Fullscreen mode');

  return (
    <Card variant="glassElevated">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Test Security Measures
        </h2>
        <p className="text-slate-700 mb-4">
          This test has enhanced security features enabled to ensure academic integrity.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
          <h3 className="font-semibold text-blue-900 mb-2">Active Security Features:</h3>
          <ul className="space-y-1">
            {features.map((feature, index) => (
              <li key={index} className="text-sm text-blue-800 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {settings.maxViolations && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-left">
            <p className="text-sm text-amber-800">
              You are allowed up to <strong>{settings.maxViolations}</strong> security violations.
              {settings.autoSubmitOnMaxViolations && (
                <> Exceeding this limit will result in automatic submission of your test.</>
              )}
            </p>
          </div>
        )}

        <div className="text-sm text-slate-600 mb-4">
          <p>By starting this test, you acknowledge that:</p>
          <ul className="mt-2 space-y-1 text-left max-w-md mx-auto">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
              <span>All actions during the test will be monitored</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
              <span>Security violations will be reported to your teacher</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
              <span>You will complete the test honestly and independently</span>
            </li>
          </ul>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={onAccept}
          className="w-full"
        >
          I Accept - Start Test
        </Button>
      </div>
    </Card>
  );
};
