// ============================================================================
// FILE PROCESSING CRON JOB
// Automatically processes pending curriculum files
// ============================================================================

import cron from 'node-cron';
import { processPendingCurriculumFiles } from '../services/fileProcessing.service';

/**
 * Runs every 5 minutes to process pending curriculum files
 * Schedule: Every 5 minutes
 */
export function startFileProcessingJob() {
  console.log('📄 File processing cron job initialized (runs every 5 minutes)');

  cron.schedule('*/5 * * * *', async () => {
    console.log('🔄 Running file processing job...');

    try {
      const result = await processPendingCurriculumFiles();

      if (result.processed > 0) {
        console.log(`✅ File processing complete: ${result.succeeded} succeeded, ${result.failed} failed`);
      }
    } catch (error) {
      console.error('❌ File processing job failed:', error);
    }
  });
}
