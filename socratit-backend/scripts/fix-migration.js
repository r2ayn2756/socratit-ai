#!/usr/bin/env node
/**
 * Fix failed migration by directly updating the Prisma migrations table
 * Uses Prisma's queryRaw to avoid needing additional dependencies
 */

const { PrismaClient } = require('@prisma/client');

async function fixMigration() {
  const migrationName = '20251116151230_update_assignment_system';

  console.log('🔧 Fixing failed migration in database...');

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  try {
    console.log('✅ Connected to database');

    // Check if migration exists in the _prisma_migrations table
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at, started_at, applied_steps_count
      FROM _prisma_migrations
      WHERE migration_name = ${migrationName}
    `;

    if (!migrations || migrations.length === 0) {
      console.log(`ℹ️  Migration ${migrationName} not found in database - it will be applied fresh`);
      await prisma.$disconnect();
      process.exit(0);
    }

    const migration = migrations[0];
    console.log(`📋 Current migration status:`, migration);

    // If migration is already successful, nothing to do
    if (migration.finished_at) {
      console.log('✅ Migration already completed successfully');
      await prisma.$disconnect();
      process.exit(0);
    }

    // Delete the failed migration record so it can be reapplied
    console.log('🗑️  Removing failed migration record...');
    await prisma.$executeRaw`
      DELETE FROM _prisma_migrations
      WHERE migration_name = ${migrationName}
    `;

    console.log('✅ Failed migration record removed - it will be reapplied during migrate deploy');

    await prisma.$disconnect();
    console.log('✅ Migration fix complete');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error fixing migration:', error.message);

    // If the _prisma_migrations table doesn't exist, that's fine - first deployment
    if (error.message.includes('_prisma_migrations') && error.message.includes('does not exist')) {
      console.log('ℹ️  No migrations table yet - this is a fresh database');
      await prisma.$disconnect();
      process.exit(0);
    }

    // For other errors, still exit with 0 to allow deployment to continue
    console.log('⚠️  Continuing with deployment despite error...');
    console.log('Error details:', error);
    try {
      await prisma.$disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    process.exit(0);
  }
}

fixMigration();
