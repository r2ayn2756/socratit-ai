/**
 * AI INSIGHTS CRON JOB
 * Runs daily at midnight to calculate AI TA insights for all classes
 */

import cron from 'node-cron';
import aiInsightsService from '../services/aiInsights.service';

/**
 * Schedule: Daily at midnight (00:00)
 */
export function scheduleAIInsightsCron() {
  // Run daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Starting AI insights refresh...');
    try {
      await aiInsightsService.refreshAllClassInsights();
      console.log('[CRON] AI insights refresh completed successfully');
    } catch (error) {
      console.error('[CRON] Error refreshing AI insights:', error);
    }
  });

  console.log('✅ AI Insights cron job scheduled (daily at midnight)');
}
