import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMessages() {
  try {
    console.log('🔍 Checking AI Messages in database...');

    // Count total messages
    const totalMessages = await prisma.aIMessage.count();
    console.log(`📊 Total AI Messages: ${totalMessages}`);

    // Get recent messages
    const recentMessages = await prisma.aIMessage.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        conversationId: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    console.log('\n📋 Recent Messages:');
    recentMessages.forEach((msg) => {
      console.log(`  - ${msg.role}: ${msg.content.substring(0, 50)}... (${msg.createdAt})`);
      console.log(`    Conversation ID: ${msg.conversationId}`);
    });

    // Check conversations
    const totalConversations = await prisma.aIConversation.count();
    console.log(`\n💬 Total Conversations: ${totalConversations}`);

    // Get recent conversations with message counts
    const recentConvs = await prisma.aIConversation.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    });

    console.log('\n📋 Recent Conversations:');
    recentConvs.forEach((conv) => {
      console.log(`  - ${conv.id}: ${conv.title || 'Untitled'}`);
      console.log(`    Messages in DB: ${conv._count.messages}`);
      console.log(`    Message count field: ${conv.messageCount}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMessages();
