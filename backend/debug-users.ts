import { prisma } from './src/config/database';

async function checkUsers() {
  try {
    console.log('Checking user records...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    console.log('Recent Users:');
    users.forEach(user => {
      console.log(`\nEmail: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Name: ${user.firstName} ${user.lastName}`);
      console.log(`Created: ${user.createdAt}`);
      console.log(`ID: ${user.id}`);
    });

    console.log(`\n\nTotal users found: ${users.length}`);

    // Check role distribution
    const teacherCount = users.filter(u => u.role === 'TEACHER').length;
    const studentCount = users.filter(u => u.role === 'STUDENT').length;
    const adminCount = users.filter(u => u.role === 'ADMIN').length;

    console.log(`\nRole Distribution:`);
    console.log(`Teachers: ${teacherCount}`);
    console.log(`Students: ${studentCount}`);
    console.log(`Admins: ${adminCount}`);

  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
