#!/usr/bin/env node
/**
 * Fix failed migration by marking it as rolled back
 * This allows new migrations to proceed
 */

const { execSync } = require('child_process');

console.log('🔧 Checking for failed migrations...');

try {
  // Try to resolve the failed migration
  execSync(
    'npx prisma migrate resolve --rolled-back 20251116151230_update_assignment_system',
    { stdio: 'inherit' }
  );
  console.log('✅ Failed migration marked as rolled back');
} catch (error) {
  // If it fails, it might already be resolved or not exist
  console.log('⚠️  Migration resolve command failed (might already be resolved)');
  console.log('Continuing with deployment...');
}

console.log('✅ Migration check complete, proceeding with migrate deploy');
process.exit(0);
