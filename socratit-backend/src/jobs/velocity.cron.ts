// ============================================================================
// LEARNING VELOCITY CRON JOB
// Runs weekly to calculate student learning velocity
// ============================================================================

import cron from 'node-cron';
import { calculateWeeklyVelocity } from '../services/progress.service';

/**
 * Initialize velocity calculation cron job
 * Runs every Sunday at midnight (00:00)
 */
export const initializeVelocityCron = (): void => {
  // Schedule: Every Sunday at 00:00
  // Format: minute hour day-of-month month day-of-week
  // 0 0 * * 0 = At 00:00 on Sunday
  cron.schedule('0 0 * * 0', async () => {
    console.log('[CRON] Starting weekly velocity calculation...');
    const startTime = Date.now();

    try {
      await calculateWeeklyVelocity();
      const duration = Date.now() - startTime;
      console.log(
        `[CRON] Weekly velocity calculation completed in ${duration}ms`
      );
    } catch (error) {
      console.error('[CRON] Error calculating weekly velocity:', error);
    }
  }, {
    timezone: 'America/New_York' // Adjust timezone as needed
  });

  console.log('✅ Learning velocity cron job initialized (runs every Sunday at midnight)');
};

/**
 * Manual trigger for velocity calculation (for testing/admin)
 */
export const triggerVelocityCalculation = async (): Promise<void> => {
  console.log('[MANUAL] Triggering velocity calculation...');
  const startTime = Date.now();

  try {
    await calculateWeeklyVelocity();
    const duration = Date.now() - startTime;
    console.log(
      `[MANUAL] Velocity calculation completed in ${duration}ms`
    );
  } catch (error) {
    console.error('[MANUAL] Error calculating velocity:', error);
    throw error;
  }
};
