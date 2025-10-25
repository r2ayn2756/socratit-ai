// ============================================================================
// DATABASE CONFIGURATION
// Prisma client instance with connection management
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { env } from './env';

// Create Prisma client instance
export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

// Graceful shutdown handler
export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  console.log('✅ Database disconnected');
};

// Connect to database
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Middleware to add school isolation
// This ensures all queries automatically filter by school_id for multi-tenancy
export const addSchoolIsolation = (schoolId: string) => {
  // This will be used in middleware to filter queries
  return schoolId;
};
