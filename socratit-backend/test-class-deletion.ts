import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testClassDeletion() {
  console.log('🧪 Testing Class Deletion with Assignment Cascade...\n');

  try {
    // Find a class with assignments
    const classWithAssignments = await prisma.class.findFirst({
      where: {
        deletedAt: null,
        assignments: {
          some: {
            deletedAt: null,
          },
        },
      },
      include: {
        assignments: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    if (!classWithAssignments) {
      console.log('❌ No class with assignments found for testing');
      console.log('Creating a test class and assignment...\n');

      // Find a teacher and school
      const teacher = await prisma.user.findFirst({
        where: { role: 'TEACHER', deletedAt: null },
      });

      if (!teacher) {
        console.log('❌ No teacher found. Cannot create test data.');
        return;
      }

      // Create a test class
      const testClass = await prisma.class.create({
        data: {
          schoolId: teacher.schoolId,
          name: 'Test Class for Deletion',
          academicYear: '2024-2025',
          classCode: `TEST-${Date.now()}`,
          teachers: {
            create: {
              teacherId: teacher.id,
              isPrimary: true,
            },
          },
        },
      });

      console.log(`✅ Created test class: ${testClass.name} (ID: ${testClass.id})`);

      // Create test assignments
      const assignment1 = await prisma.assignment.create({
        data: {
          classId: testClass.id,
          schoolId: teacher.schoolId,
          createdBy: teacher.id,
          title: 'Test Assignment 1',
          type: 'PRACTICE',
          status: 'DRAFT',
        },
      });

      const assignment2 = await prisma.assignment.create({
        data: {
          classId: testClass.id,
          schoolId: teacher.schoolId,
          createdBy: teacher.id,
          title: 'Test Assignment 2',
          type: 'QUIZ',
          status: 'DRAFT',
        },
      });

      console.log(`✅ Created test assignment 1: ${assignment1.title} (ID: ${assignment1.id})`);
      console.log(`✅ Created test assignment 2: ${assignment2.title} (ID: ${assignment2.id})\n`);

      console.log('📊 Before deletion:');
      console.log(`   Class: ${testClass.name}`);
      console.log(`   Assignments: 2`);
      console.log(`   - ${assignment1.title}`);
      console.log(`   - ${assignment2.title}\n`);

      // Simulate the deletion (soft delete)
      const deletionDate = new Date();
      await prisma.$transaction([
        prisma.class.update({
          where: { id: testClass.id },
          data: {
            deletedAt: deletionDate,
            isActive: false,
          },
        }),
        prisma.assignment.updateMany({
          where: {
            classId: testClass.id,
            deletedAt: null,
          },
          data: {
            deletedAt: deletionDate,
          },
        }),
      ]);

      console.log('🗑️  Soft deleted class and assignments\n');

      // Verify deletion
      const deletedClass = await prisma.class.findUnique({
        where: { id: testClass.id },
      });

      const activeAssignments = await prisma.assignment.findMany({
        where: {
          classId: testClass.id,
          deletedAt: null,
        },
      });

      const deletedAssignments = await prisma.assignment.findMany({
        where: {
          classId: testClass.id,
          deletedAt: { not: null },
        },
      });

      console.log('📊 After deletion:');
      console.log(`   Class deletedAt: ${deletedClass?.deletedAt}`);
      console.log(`   Class isActive: ${deletedClass?.isActive}`);
      console.log(`   Active assignments: ${activeAssignments.length}`);
      console.log(`   Deleted assignments: ${deletedAssignments.length}\n`);

      if (deletedClass?.deletedAt && !deletedClass?.isActive && activeAssignments.length === 0 && deletedAssignments.length === 2) {
        console.log('✅ SUCCESS! Class deletion correctly cascaded to all assignments');
      } else {
        console.log('❌ FAILED! Deletion did not cascade correctly');
      }

    } else {
      console.log(`⚠️  Found existing class with assignments: ${classWithAssignments.name}`);
      console.log(`   This is a real class. Skipping deletion test to avoid data loss.`);
      console.log(`   Assignment count: ${classWithAssignments.assignments.length}`);
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testClassDeletion();
