// ============================================================================
// DATABASE SEED
// Seeds the database with initial data for development
// ============================================================================

import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import { PrismaClient, UserRole } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create schools
  const school1 = await prisma.school.upsert({
    where: { schoolCode: 'DEMO0001' },
    update: {},
    create: {
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
      name: 'Test Middle School',
      schoolCode: 'TEST0002',
      districtName: 'Test School District',
      address: '456 Learning Ave, Education Town, ST 54321',
    },
  });

  console.log('✅ Created school:', school2.name);

  // Hash password for test accounts
  const demoPassword = await hashPassword('Password123');

  // Create demo teacher
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@demo.com' },
    update: {},
    create: {
      email: 'teacher@demo.com',
      passwordHash: demoPassword,
      firstName: 'Sarah',
      lastName: 'Teacher',
      role: UserRole.TEACHER,
      schoolId: school1.id,
      emailVerified: true,
    },
  });

  console.log('✅ Created teacher:', teacher.email);

  // Create demo student
  const student = await prisma.user.upsert({
    where: { email: 'student@demo.com' },
    update: {},
    create: {
      email: 'student@demo.com',
      passwordHash: demoPassword,
      firstName: 'Alex',
      lastName: 'Student',
      role: UserRole.STUDENT,
      schoolId: school1.id,
      gradeLevel: '10th Grade',
      emailVerified: true,
    },
  });

  console.log('✅ Created student:', student.email);

  // Create demo admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      passwordHash: demoPassword,
      firstName: 'John',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      schoolId: school1.id,
      emailVerified: true,
    },
  });

  console.log('✅ Created admin:', admin.email);

  // Create additional test users
  const teacher2 = await prisma.user.upsert({
    where: { email: 'teacher2@test.com' },
    update: {},
    create: {
      email: 'teacher2@test.com',
      passwordHash: demoPassword,
      firstName: 'Michael',
      lastName: 'Johnson',
      role: UserRole.TEACHER,
      schoolId: school2.id,
      emailVerified: true,
    },
  });

  console.log('✅ Created teacher:', teacher2.email);

  console.log('');
  console.log('========================================');
  console.log('🎉 Database seed completed!');
  console.log('========================================');
  console.log('');
  console.log('📚 Test Accounts:');
  console.log('  Teacher: teacher@demo.com / Password123');
  console.log('  Student: student@demo.com / Password123');
  console.log('  Admin:   admin@demo.com / Password123');
  console.log('');
  console.log('🏫 School Codes:');
  console.log('  Demo High School: DEMO0001');
  console.log('  Test Middle School: TEST0002');
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
