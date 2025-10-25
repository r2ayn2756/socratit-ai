// Quick script to create a demo school for testing
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.upsert({
    where: { schoolCode: 'DEMO0001' },
    update: {},
    create: {
      schoolCode: 'DEMO0001',
      name: 'Demo School',
      districtName: 'Demo District',
    },
  });

  console.log('✅ Demo school created:', school);
  console.log('   School Code: DEMO0001');
  console.log('   Use this code when signing up!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
