// ============================================================================
// CURRICULUM CLEANUP CRON JOB
// Automatically deletes expired curriculum materials
// ============================================================================

import cron from 'node-cron';
import { cleanupExpiredCurriculum } from '../services/curriculum.service';

/**
 * Runs daily at 2:00 AM to cleanup expired curriculum materials
 * Schedule: "0 2 * * *" = At 02:00 every day
 */
export function startCurriculumCleanupJob() {
  console.log('📅 Curriculum cleanup cron job initialized');

  cron.schedule('0 2 * * *', async () => {
    console.log('🧹 Running curriculum cleanup job...');

    try {
      const deletedCount = await cleanupExpiredCurriculum();
      console.log(`✅ Curriculum cleanup complete: ${deletedCount} materials deleted`);
    } catch (error) {
      console.error('❌ Curriculum cleanup job failed:', error);
    }
  });
}
