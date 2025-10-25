// ============================================================================
// SEED CONTROLLER
// One-time endpoint to seed initial database data
// ============================================================================

import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Seed database with demo schools
 * @route GET /api/v1/seed
 * @access Public (should be protected in production!)
 */
export const seedDatabase = async (_req: Request, res: Response) => {
  try {
    console.log('🌱 Starting database seed...');

    // Create demo school
    const school1 = await prisma.school.upsert({
      where: { schoolCode: 'DEMO0001' },
      update: {},
      create: {
        id: uuidv4(),
        name: 'Demo High School',
        schoolCode: 'DEMO0001',
        districtName: 'Demo School District',
        address: '123 Education St, Learning City, ST 12345',
      },
    });

    console.log('✅ Created school:', school1.name);

    const school2 = await prisma.school.upsert({
      where: { schoolCode: 'TEST0002' },
      update: {},
      create: {
        id: uuidv4(),
        name: 'Test Middle School',
        schoolCode: 'TEST0002',
        districtName: 'Test School District',
        address: '456 Learning Ave, Education Town, ST 54321',
      },
    });

    console.log('✅ Created school:', school2.name);

    res.status(200).json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        schools: [
          { name: school1.name, code: school1.schoolCode },
          { name: school2.name, code: school2.schoolCode },
        ],
      },
    });
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed database',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
