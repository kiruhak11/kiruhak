import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  // Очищаем существующие данные
  await prisma.project.deleteMany();
  await prisma.site.deleteMany();
  await prisma.user.deleteMany();

  // Создаем тестового пользователя-администратора
  const adminUser = await prisma.user.create({
    data: {
      telegramId: "123456789",
      username: "demo_user",
      firstName: "Демо",
      lastName: "Администратор",
      photoUrl: null,
      login: "admin",
      password: "admin123", // В реальном проекте нужно хешировать
      isAdmin: true,
      balance: 15000, // 150 рублей
    },
  });

  console.log(
    `Created admin user: ${adminUser.firstName} ${adminUser.lastName}`
  );

  // Создаем тестовый сайт для админа
  const testSite = await prisma.site.create({
    data: {
      name: "Тестовый сайт",
      domain: "test.example.com",
      description: "Сайт для тестирования аналитики",
      userId: adminUser.id,
    },
  });

  console.log(`Created test site: ${testSite.name}`);

  // Создаем тестовые проекты
  const projects = [
    {
      title: "KES — КотлоЭнергоСнаб: корпоративный портал",
      description:
        "Корпоративный портал с личными кабинетами, каталогом оборудования, интеграциями и отчетностью. Внедрение CRM, склад, финансы, аналитика.",
      shortDescription: "Корпоративный портал с CRM и аналитикой",
      image: "https://placehold.co/600x400?text=KES+System",
      technologies: [
        "Vue.js",
        "Nuxt 3",
        "Node.js",
        "Telegram Bot",
        "Supabase",
        "Docker",
        "Nginx",
      ],
      category: "Корпоративные порталы",
      client: "КотлоЭнергоСнаб",
      duration: "3 месяца",
      budget: "от 500,000 ₽",
      features: [
        "Личные кабинеты",
        "Каталог оборудования",
        "CRM система",
        "Аналитика",
        "Интеграции",
      ],
      challenges: "Сложная интеграция с существующими системами предприятия",
      solutions: "Поэтапное внедрение с тестированием на каждом этапе",
      results:
        "Автоматизация 80% процессов, сокращение времени обработки заявок на 60%",
      liveUrl: "https://kes.kiruhak11.ru",
      githubUrl: null,
      featured: true,
      order: 1,
    },
    {
      title: "AirPods Store — интернет‑витрина",
      description:
        "Интернет‑витрина аксессуаров для Apple. Каталог, корзина, оформление заказа, адаптивный UI.",
      shortDescription: "Интернет-магазин аксессуаров Apple",
      image: "https://placehold.co/600x400?text=AirPods+Store",
      technologies: [
        "Vue.js",
        "Nuxt.js",
        "SCSS",
        "Supabase",
        "Responsive Design",
      ],
      category: "E-commerce",
      client: "Частный предприниматель",
      duration: "1.5 месяца",
      budget: "от 150,000 ₽",
      features: [
        "Каталог товаров",
        "Корзина",
        "Оформление заказа",
        "Адаптивный дизайн",
      ],
      challenges: "Создание удобного интерфейса для мобильных устройств",
      solutions: "Mobile-first подход с оптимизацией под все устройства",
      results: "Конверсия 3.2%, средний чек 15,000 ₽",
      liveUrl: "https://airpodsstore.kiruhak11.ru",
      githubUrl: null,
      featured: true,
      order: 2,
    },
    {
      title: "Mixer Timetable — расписание и планирование",
      description:
        "Веб‑приложение планирования: календарь, задачи, экспорт PDF, уведомления.",
      shortDescription: "Приложение для планирования и управления временем",
      image: "https://placehold.co/600x400?text=Mixer+Timetable",
      technologies: ["Vue.js", "TypeScript", "PDF", "Local Storage"],
      category: "Продуктивность",
      client: "Студия звукозаписи",
      duration: "1 месяц",
      budget: "от 80,000 ₽",
      features: ["Календарь", "Задачи", "Экспорт PDF", "Уведомления"],
      challenges: "Создание интуитивного интерфейса для планирования",
      solutions: "Простой и понятный дизайн с быстрым доступом к функциям",
      results: "Повышение эффективности планирования на 40%",
      liveUrl: "https://mixers-adalin.ru",
      githubUrl: null,
      featured: false,
      order: 3,
    },
    {
      title: "DevHorizon — платформа для разработчиков",
      description:
        "Платформа для разработчиков: блоги, туториалы, рейтинги, поиск.",
      shortDescription: "Платформа для сообщества разработчиков",
      image: "https://placehold.co/600x400?text=DevHorizon",
      technologies: ["Vue.js", "Nuxt.js", "Prisma", "Docker", "PostgreSQL"],
      category: "Социальные платформы",
      client: "Собственный проект",
      duration: "2 месяца",
      budget: "Собственные инвестиции",
      features: ["Блоги", "Туториалы", "Рейтинги", "Поиск", "Профили"],
      challenges: "Создание активного сообщества разработчиков",
      solutions: "Фокус на качественном контенте и удобстве использования",
      results: "Проект в разработке",
      liveUrl: null,
      githubUrl: "https://github.com/kiruhak/devhorizon",
      featured: false,
      order: 4,
    },
  ];

  for (const project of projects) {
    await prisma.project.create({
      data: project,
    });
  }

  console.log("База данных заполнена тестовыми проектами!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
