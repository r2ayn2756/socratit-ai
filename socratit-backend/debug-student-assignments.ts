// ============================================================================
// DEBUG SCRIPT - Student Assignment Visibility
// Run this to diagnose why students can't see assignments
// ============================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugStudentAssignments() {
  console.log('🔍 Debugging Student Assignment Visibility\n');
  console.log('='.repeat(60));

  // 1. Find a student user
  const student = await prisma.user.findFirst({
    where: { role: 'STUDENT' },
  });

  if (!student) {
    console.log('❌ No student users found in database');
    console.log('   Create a student account first');
    return;
  }

  console.log('\n📚 STUDENT INFORMATION');
  console.log(`   ID: ${student.id}`);
  console.log(`   Email: ${student.email}`);
  console.log(`   Name: ${student.firstName} ${student.lastName}`);
  console.log(`   School ID: ${student.schoolId}`);

  // 2. Check student's class enrollments
  const enrollments = await prisma.classEnrollment.findMany({
    where: { studentId: student.id },
    include: { class: true },
  });

  console.log(`\n📋 CLASS ENROLLMENTS (${enrollments.length})`);
  if (enrollments.length === 0) {
    console.log('   ❌ Student is not enrolled in any classes!');
    console.log('   → ACTION: Enroll the student in a class first');
  } else {
    enrollments.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.class.name}`);
      console.log(`      Class ID: ${e.classId}`);
      console.log(`      Status: ${e.status} ${e.status === 'APPROVED' ? '✅' : '❌'}`);
      if (e.status !== 'APPROVED') {
        console.log('      → ACTION: Approve this enrollment');
      }
    });
  }

  const approvedEnrollments = enrollments.filter((e) => e.status === 'APPROVED');
  const enrolledClassIds = approvedEnrollments.map((e) => e.classId);

  // Initialize variables
  let visibleAssignments: any[] = [];
  let assignments: any[] = [];

  // 3. Check assignments in those classes
  if (enrolledClassIds.length > 0) {
    assignments = await prisma.assignment.findMany({
      where: {
        classId: { in: enrolledClassIds },
        deletedAt: null,
      },
      include: {
        class: { select: { name: true } },
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`\n📝 ASSIGNMENTS IN ENROLLED CLASSES (${assignments.length})`);
    if (assignments.length === 0) {
      console.log('   ❌ No assignments found in enrolled classes');
      console.log('   → ACTION: Create assignments in the classes the student is enrolled in');
    } else {
      assignments.forEach((a, i) => {
        console.log(`\n   ${i + 1}. ${a.title}`);
        console.log(`      Class: ${a.class.name}`);
        console.log(`      Status: ${a.status} ${a.status === 'ACTIVE' ? '✅' : '❌ (students only see ACTIVE)'}`);
        console.log(`      Questions: ${a._count.questions} ${a._count.questions > 0 ? '✅' : '❌ (needs at least 1)'}`);
        console.log(`      Created: ${a.createdAt.toLocaleDateString()}`);
        if (a.dueDate) {
          console.log(`      Due: ${a.dueDate.toLocaleDateString()}`);
        }

        if (a.status !== 'ACTIVE') {
          console.log(`      → ACTION: Publish this assignment (status: ${a.status} → ACTIVE)`);
        }
        if (a._count.questions === 0) {
          console.log(`      → ACTION: Add questions to this assignment`);
        }
      });
    }

    // 4. What students SHOULD see
    visibleAssignments = assignments.filter(
      (a) => a.status === 'ACTIVE' && a._count.questions > 0
    );

    console.log(`\n✅ VISIBLE TO STUDENT (${visibleAssignments.length})`);
    if (visibleAssignments.length === 0) {
      console.log('   ❌ No assignments are currently visible to this student');
      console.log('\n   📋 CHECKLIST TO MAKE ASSIGNMENTS VISIBLE:');
      console.log('   □ Assignment must have status = ACTIVE (click Publish button)');
      console.log('   □ Assignment must have at least 1 question');
      console.log('   □ Student must be enrolled in the class with status = APPROVED');
    } else {
      visibleAssignments.forEach((a, i) => {
        console.log(`   ${i + 1}. ${a.title} (${a.class.name})`);
      });
    }
  }

  // 5. Check all teachers
  const teachers = await prisma.user.findMany({
    where: { role: 'TEACHER', schoolId: student.schoolId },
  });

  console.log(`\n👨‍🏫 TEACHERS (${teachers.length})`);
  teachers.forEach((t, i) => {
    console.log(`   ${i + 1}. ${t.firstName} ${t.lastName} (${t.email})`);
  });

  // 6. Check all classes in school
  const allClasses = await prisma.class.findMany({
    where: { schoolId: student.schoolId },
    include: {
      _count: {
        select: {
          assignments: true,
          enrollments: true,
        },
      },
    },
  });

  console.log(`\n🏫 ALL CLASSES IN SCHOOL (${allClasses.length})`);
  allClasses.forEach((c, i) => {
    const studentEnrolled = enrolledClassIds.includes(c.id);
    console.log(`   ${i + 1}. ${c.name} ${studentEnrolled ? '✅ (enrolled)' : '⚪ (not enrolled)'}`);
    console.log(`      Assignments: ${c._count.assignments}`);
    console.log(`      Students: ${c._count.enrollments}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('🎯 SUMMARY & NEXT STEPS');
  console.log('='.repeat(60));

  if (enrolledClassIds.length === 0) {
    console.log('\n❌ ISSUE: Student not enrolled in any classes');
    console.log('   SOLUTION: Enroll the student in a class');
  } else if (visibleAssignments.length === 0) {
    console.log('\n❌ ISSUE: No visible assignments');
    console.log('   SOLUTION: Make sure assignments are:');
    console.log('   1. Published (status = ACTIVE)');
    console.log('   2. Have at least 1 question');
    console.log('   3. In a class the student is enrolled in');
  } else {
    console.log('\n✅ Everything looks good!');
    console.log(`   Student should see ${visibleAssignments.length} assignment(s)`);
  }
}

debugStudentAssignments()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
