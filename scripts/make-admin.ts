import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin() {
  const username = process.argv[2];
  
  if (!username) {
    console.log('❌ Укажите имя пользователя');
    console.log('Использование: npm run make-admin <username>');
    process.exit(1);
  }

  try {
    // Ищем пользователя
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { firstName: username },
        ]
      }
    });

    if (!user) {
      console.log(`❌ Пользователь "${username}" не найден`);
      process.exit(1);
    }

    // Обновляем права
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: true }
    });

    console.log('✅ Права администратора успешно назначены!');
    console.log(`👤 Пользователь: ${updated.firstName} ${updated.lastName}`);
    console.log(`📧 Username: ${updated.username}`);
    console.log(`🔐 isAdmin: ${updated.isAdmin}`);
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();

