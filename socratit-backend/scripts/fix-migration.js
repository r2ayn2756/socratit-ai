#!/usr/bin/env node
/**
 * Fix failed migration by directly updating the Prisma migrations table
 * This is more reliable than using prisma migrate resolve in production
 */

const { Client } = require('pg');

async function fixMigration() {
  const migrationName = '20251116151230_update_assignment_system';

  console.log('🔧 Fixing failed migration in database...');

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if migration exists in the _prisma_migrations table
    const checkQuery = `
      SELECT migration_name, finished_at, started_at, applied_steps_count
      FROM _prisma_migrations
      WHERE migration_name = $1
    `;

    const checkResult = await client.query(checkQuery, [migrationName]);

    if (checkResult.rows.length === 0) {
      console.log(`ℹ️  Migration ${migrationName} not found in database - it will be applied fresh`);
      await client.end();
      process.exit(0);
    }

    const migration = checkResult.rows[0];
    console.log(`📋 Current migration status:`, migration);

    // If migration is already successful, nothing to do
    if (migration.finished_at && !migration.finished_at.toString().includes('NULL')) {
      console.log('✅ Migration already completed successfully');
      await client.end();
      process.exit(0);
    }

    // Delete the failed migration record so it can be reapplied
    console.log('🗑️  Removing failed migration record...');
    const deleteQuery = `
      DELETE FROM _prisma_migrations
      WHERE migration_name = $1
    `;

    await client.query(deleteQuery, [migrationName]);
    console.log('✅ Failed migration record removed - it will be reapplied during migrate deploy');

    await client.end();
    console.log('✅ Migration fix complete');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error fixing migration:', error.message);

    // If the _prisma_migrations table doesn't exist, that's fine - first deployment
    if (error.message.includes('_prisma_migrations') && error.message.includes('does not exist')) {
      console.log('ℹ️  No migrations table yet - this is a fresh database');
      await client.end();
      process.exit(0);
    }

    // For other errors, still exit with 0 to allow deployment to continue
    console.log('⚠️  Continuing with deployment despite error...');
    try {
      await client.end();
    } catch (e) {
      // Ignore disconnect errors
    }
    process.exit(0);
  }
}

fixMigration();
