// ============================================================================
// FIX STUDENT ENROLLMENT
// Enrolls the student in the "AP Bio" class that has assignments
// ============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixEnrollment() {
  console.log('🔧 Fixing Student Enrollment\n');

  // Find the student
  const student = await prisma.user.findFirst({
    where: { email: 'student@demo.com' },
  });

  if (!student) {
    console.log('❌ Student not found');
    return;
  }

  // Find the "AP Bio" class with assignments
  const apBioClass = await prisma.class.findFirst({
    where: {
      name: 'AP Bio',
      schoolId: student.schoolId,
    },
    include: {
      _count: { select: { assignments: true } },
    },
  });

  if (!apBioClass) {
    console.log('❌ AP Bio class not found');
    return;
  }

  console.log(`📚 Found class: ${apBioClass.name}`);
  console.log(`   Class ID: ${apBioClass.id}`);
  console.log(`   Assignments: ${apBioClass._count.assignments}`);

  // Check if already enrolled
  const existingEnrollment = await prisma.classEnrollment.findFirst({
    where: {
      studentId: student.id,
      classId: apBioClass.id,
    },
  });

  if (existingEnrollment) {
    console.log(`\n✅ Student already enrolled in ${apBioClass.name}`);
    console.log(`   Status: ${existingEnrollment.status}`);

    if (existingEnrollment.status !== 'APPROVED') {
      await prisma.classEnrollment.update({
        where: { id: existingEnrollment.id },
        data: { status: 'APPROVED' },
      });
      console.log('   ✅ Updated status to APPROVED');
    }
  } else {
    // Create new enrollment
    const enrollment = await prisma.classEnrollment.create({
      data: {
        studentId: student.id,
        classId: apBioClass.id,
        status: 'APPROVED',
      },
    });

    console.log(`\n✅ Enrolled student in ${apBioClass.name}`);
    console.log(`   Enrollment ID: ${enrollment.id}`);
    console.log(`   Status: ${enrollment.status}`);
  }

  // Check how many assignments are now visible
  const visibleAssignments = await prisma.assignment.findMany({
    where: {
      classId: apBioClass.id,
      status: 'ACTIVE',
      deletedAt: null,
    },
    include: {
      _count: { select: { questions: true } },
    },
  });

  const actuallyVisible = visibleAssignments.filter((a) => a._count.questions > 0);

  console.log(`\n📊 RESULT:`);
  console.log(`   Total assignments in class: ${apBioClass._count.assignments}`);
  console.log(`   Active assignments: ${visibleAssignments.length}`);
  console.log(`   Visible to student: ${actuallyVisible.length}`);

  if (actuallyVisible.length > 0) {
    console.log(`\n✅ SUCCESS! Student should now see:`);
    actuallyVisible.forEach((a, i) => {
      console.log(`   ${i + 1}. ${a.title} (${a._count.questions} questions)`);
    });
  } else {
    console.log(`\n⚠️  Note: No ACTIVE assignments with questions found`);
    console.log(`   Teachers need to PUBLISH the assignments for students to see them`);
  }
}

fixEnrollment()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
