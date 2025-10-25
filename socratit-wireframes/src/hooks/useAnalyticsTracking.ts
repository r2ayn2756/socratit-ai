// ============================================================================
// ANALYTICS TRACKING HOOK
// Batch 7: Custom React hook for tracking user interactions and events
// ============================================================================

import React, { useCallback, useEffect, useRef } from 'react';
import { trackEvent } from '../services/analytics.service';

interface UseAnalyticsTrackingOptions {
  /**
   * Whether to automatically track page views
   */
  trackPageViews?: boolean;

  /**
   * Whether to automatically track element clicks with data-analytics attributes
   */
  trackClicks?: boolean;

  /**
   * Additional metadata to include with all events
   */
  metadata?: Record<string, any>;
}

/**
 * Custom hook for tracking analytics events
 *
 * @example
 * ```tsx
 * const { trackPageView, trackClick, trackCustomEvent } = useAnalyticsTracking({
 *   trackPageViews: true,
 *   metadata: { userId: user.id, role: user.role }
 * });
 *
 * // Track custom event
 * trackCustomEvent('assignment_created', { assignmentId: '123', type: 'quiz' });
 *
 * // Track button click
 * <button onClick={() => trackClick('submit_button')}>Submit</button>
 * ```
 */
export const useAnalyticsTracking = (options: UseAnalyticsTrackingOptions = {}) => {
  const {
    trackPageViews = false,
    trackClicks = false,
    metadata = {}
  } = options;

  const trackedRef = useRef(false);

  /**
   * Track a page view event
   */
  const trackPageView = useCallback(async (pageName: string, additionalMetadata?: Record<string, any>) => {
    try {
      await trackEvent('page_view', {
        page: pageName,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        ...metadata,
        ...additionalMetadata,
      });
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }, [metadata]);

  /**
   * Track a click event
   */
  const trackClick = useCallback(async (elementId: string, additionalMetadata?: Record<string, any>) => {
    try {
      await trackEvent('click', {
        elementId,
        timestamp: new Date().toISOString(),
        ...metadata,
        ...additionalMetadata,
      });
    } catch (error) {
      console.error('Failed to track click:', error);
    }
  }, [metadata]);

  /**
   * Track a custom event
   */
  const trackCustomEvent = useCallback(async (
    eventType: string,
    eventMetadata?: Record<string, any>
  ) => {
    try {
      await trackEvent(eventType, {
        timestamp: new Date().toISOString(),
        ...metadata,
        ...eventMetadata,
      });
    } catch (error) {
      console.error('Failed to track custom event:', error);
    }
  }, [metadata]);

  /**
   * Track form submission
   */
  const trackFormSubmit = useCallback(async (formId: string, additionalMetadata?: Record<string, any>) => {
    try {
      await trackEvent('form_submit', {
        formId,
        timestamp: new Date().toISOString(),
        ...metadata,
        ...additionalMetadata,
      });
    } catch (error) {
      console.error('Failed to track form submission:', error);
    }
  }, [metadata]);

  /**
   * Track assignment interaction
   */
  const trackAssignmentInteraction = useCallback(async (
    action: 'start' | 'submit' | 'save_draft' | 'view',
    assignmentId: string,
    additionalMetadata?: Record<string, any>
  ) => {
    try {
      await trackEvent(`assignment_${action}`, {
        assignmentId,
        timestamp: new Date().toISOString(),
        ...metadata,
        ...additionalMetadata,
      });
    } catch (error) {
      console.error('Failed to track assignment interaction:', error);
    }
  }, [metadata]);

  /**
   * Track navigation
   */
  const trackNavigation = useCallback(async (
    from: string,
    to: string,
    additionalMetadata?: Record<string, any>
  ) => {
    try {
      await trackEvent('navigation', {
        from,
        to,
        timestamp: new Date().toISOString(),
        ...metadata,
        ...additionalMetadata,
      });
    } catch (error) {
      console.error('Failed to track navigation:', error);
    }
  }, [metadata]);

  /**
   * Track time spent on page/component
   */
  const trackTimeSpent = useCallback(async (
    componentName: string,
    timeSpentSeconds: number,
    additionalMetadata?: Record<string, any>
  ) => {
    try {
      await trackEvent('time_spent', {
        componentName,
        timeSpentSeconds,
        timestamp: new Date().toISOString(),
        ...metadata,
        ...additionalMetadata,
      });
    } catch (error) {
      console.error('Failed to track time spent:', error);
    }
  }, [metadata]);

  /**
   * Track search
   */
  const trackSearch = useCallback(async (
    query: string,
    resultsCount: number,
    additionalMetadata?: Record<string, any>
  ) => {
    try {
      await trackEvent('search', {
        query,
        resultsCount,
        timestamp: new Date().toISOString(),
        ...metadata,
        ...additionalMetadata,
      });
    } catch (error) {
      console.error('Failed to track search:', error);
    }
  }, [metadata]);

  /**
   * Track error
   */
  const trackError = useCallback(async (
    errorType: string,
    errorMessage: string,
    additionalMetadata?: Record<string, any>
  ) => {
    try {
      await trackEvent('error', {
        errorType,
        errorMessage,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...metadata,
        ...additionalMetadata,
      });
    } catch (error) {
      console.error('Failed to track error:', error);
    }
  }, [metadata]);

  // Auto-track page views on mount
  useEffect(() => {
    if (trackPageViews && !trackedRef.current) {
      trackedRef.current = true;
      const pageName = document.title || window.location.pathname;
      trackPageView(pageName);
    }
  }, [trackPageViews, trackPageView]);

  // Auto-track clicks with data-analytics attribute
  useEffect(() => {
    if (!trackClicks) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const analyticsElement = target.closest('[data-analytics]');

      if (analyticsElement) {
        const analyticsData = analyticsElement.getAttribute('data-analytics');
        if (analyticsData) {
          trackClick(analyticsData);
        }
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [trackClicks, trackClick]);

  // Track time spent on component (unmount)
  useEffect(() => {
    const startTime = Date.now();
    const componentName = document.title || 'Unknown Component';

    return () => {
      const endTime = Date.now();
      const timeSpent = Math.floor((endTime - startTime) / 1000); // Convert to seconds

      if (timeSpent > 5) { // Only track if spent more than 5 seconds
        trackTimeSpent(componentName, timeSpent);
      }
    };
  }, [trackTimeSpent]);

  return {
    trackPageView,
    trackClick,
    trackCustomEvent,
    trackFormSubmit,
    trackAssignmentInteraction,
    trackNavigation,
    trackTimeSpent,
    trackSearch,
    trackError,
  };
};

/**
 * HOC for wrapping components with analytics tracking
 */
export const withAnalyticsTracking = <P extends object>(
  Component: React.ComponentType<P>,
  options?: UseAnalyticsTrackingOptions
) => {
  return (props: P) => {
    useAnalyticsTracking(options);
    return React.createElement(Component, props);
  };
};
