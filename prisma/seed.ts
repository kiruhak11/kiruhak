import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("Начинаем заполнение базы данных...");

  // Очищаем существующие данные
  await prisma.tutorialTestAnswer.deleteMany();
  await prisma.tutorialTestQuestion.deleteMany();
  await prisma.tutorialProgress.deleteMany();
  await prisma.tutorialStep.deleteMany();
  await prisma.tutorial.deleteMany();
  await prisma.materialRating.deleteMany();
  await prisma.materialDownload.deleteMany();
  await prisma.material.deleteMany();
  await prisma.uiComponent.deleteMany();
  await prisma.project.deleteMany();
  await prisma.site.deleteMany();
  await prisma.user.deleteMany();

  console.log("Существующие данные очищены");

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

  // Создаем UI компоненты
  console.log("Создаем UI компоненты...");

  const uiComponents = [
    {
      name: "Кнопка с градиентом",
      description: "Современная кнопка с градиентным фоном и анимацией",
      category: "buttons",
      code: `<button class="gradient-button">Нажми меня</button>`,
      html: `<button class="gradient-button">Нажми меня</button>`,
      css: `.gradient-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.gradient-button:hover {
  transform: translateY(-2px);
}`,
      js: "",
      preview: "https://placehold.co/300x200?text=Gradient+Button",
      tags: ["кнопка", "градиент", "анимация"],
      order: 1,
    },
    {
      name: "Карточка с тенью",
      description: "Карточка с красивой тенью и hover эффектом",
      category: "cards",
      code: `<div class="shadow-card">
  <h3>Заголовок карточки</h3>
  <p>Описание карточки с красивым дизайном</p>
  <button class="card-button">Действие</button>
</div>`,
      html: `<div class="shadow-card">
  <h3>Заголовок карточки</h3>
  <p>Описание карточки с красивым дизайном</p>
  <button class="card-button">Действие</button>
</div>`,
      css: `.shadow-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
}

.shadow-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}`,
      js: "",
      preview: "https://placehold.co/300x200?text=Shadow+Card",
      tags: ["карточка", "тень", "hover"],
      order: 2,
    },
    {
      name: "Анимированный инпут",
      description: "Поле ввода с анимированной подсказкой",
      category: "inputs",
      code: `<div class="input-container">
  <input type="text" id="animated-input" required>
  <label for="animated-input">Ваше имя</label>
</div>`,
      html: `<div class="input-container">
  <input type="text" id="animated-input" required>
  <label for="animated-input">Ваше имя</label>
</div>`,
      css: `.input-container {
  position: relative;
  margin: 20px 0;
}

.input-container input {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.input-container input:focus {
  outline: none;
  border-color: #3b82f6;
}

.input-container label {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  transition: all 0.3s ease;
  pointer-events: none;
}

.input-container input:focus + label,
.input-container input:not(:placeholder-shown) + label {
  top: 0;
  font-size: 12px;
  color: #3b82f6;
  background: white;
  padding: 0 4px;
}`,
      js: "",
      preview: "https://placehold.co/300x200?text=Animated+Input",
      tags: ["инпут", "анимация", "подсказка"],
      order: 3,
    },
  ];

  for (const component of uiComponents) {
    await prisma.uiComponent.create({
      data: component,
    });
  }

  console.log("UI компоненты созданы!");

  // Создаем материалы
  console.log("Создаем материалы...");

  const materials = [
    {
      title: "Чек-лист оптимизации Vue.js приложения",
      description:
        "Полный чек-лист для оптимизации производительности Vue.js приложений",
      type: "checklist",
      category: "performance",
      pages: 3,
      features: ["Vue 3", "Оптимизация", "Производительность"],
      content: `<h2>Чек-лист оптимизации Vue.js приложения</h2>
<h3>1. Компоненты</h3>
<ul>
  <li>Используйте lazy loading для компонентов</li>
  <li>Применяйте v-memo для кэширования</li>
  <li>Разбивайте большие компоненты на мелкие</li>
</ul>
<h3>2. Реактивность</h3>
<ul>
  <li>Используйте shallowRef для больших объектов</li>
  <li>Применяйте markRaw для статических данных</li>
  <li>Оптимизируйте computed свойства</li>
</ul>`,
      order: 1,
    },
    {
      title: "Шаблон компонента Vue 3",
      description: "Готовый шаблон для создания Vue 3 компонентов с TypeScript",
      type: "template",
      category: "ui",
      pages: 2,
      features: ["Vue 3", "TypeScript", "Composition API"],
      content: `<h2>Шаблон Vue 3 компонента</h2>
<pre><code>&lt;template&gt;
  &lt;div class="component"&gt;
    &lt;h3&gt;{{ title }}&lt;/h3&gt;
    &lt;p&gt;{{ description }}&lt;/p&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;script setup lang="ts"&gt;
interface Props {
  title: string;
  description?: string;
}

const props = defineProps&lt;Props&gt;();
&lt;/script&gt;

&lt;style scoped&gt;
.component {
  padding: 1rem;
  border-radius: 8px;
  background: white;
}
&lt;/style&gt;</code></pre>`,
      order: 2,
    },
    {
      title: "Архитектура Nuxt 3 приложения",
      description: "Руководство по правильной архитектуре Nuxt 3 приложений",
      type: "architecture",
      category: "deployment",
      pages: 5,
      features: ["Nuxt 3", "Архитектура", "Структура"],
      content: `<h2>Архитектура Nuxt 3 приложения</h2>
<h3>Структура папок</h3>
<ul>
  <li><strong>pages/</strong> - маршруты приложения</li>
  <li><strong>components/</strong> - переиспользуемые компоненты</li>
  <li><strong>composables/</strong> - логика приложения</li>
  <li><strong>server/</strong> - API endpoints</li>
</ul>
<h3>Лучшие практики</h3>
<ul>
  <li>Используйте auto-imports</li>
  <li>Разделяйте клиентский и серверный код</li>
  <li>Применяйте middleware для аутентификации</li>
</ul>`,
      order: 3,
    },
  ];

  for (const material of materials) {
    await prisma.material.create({
      data: material,
    });
  }

  console.log("Материалы созданы!");

  // Создаем туториалы
  console.log("Создаем туториалы...");

  const tutorials = [
    {
      title: "Основы Vue 3 Composition API",
      description:
        "Изучите основы Vue 3 Composition API с практическими примерами",
      difficulty: "beginner",
      category: "vue",
      duration: "25 мин",
      features: ["Vue 3", "Composition API", "Реактивность"],
      order: 1,
      steps: [
        {
          title: "Введение в Composition API",
          content: `<h3>Что такое Composition API?</h3>
<p>Composition API - это новый способ организации логики в Vue 3 компонентах. Он позволяет лучше переиспользовать код и организовывать логику по функциональности.</p>
<pre><code>import { ref, computed } from 'vue'

export default {
  setup() {
    const count = ref(0)
    const doubleCount = computed(() => count.value * 2)
    
    return { count, doubleCount }
  }
}</code></pre>`,
          order: 1,
        },
        {
          title: "Реактивные данные",
          content: `<h3>Работа с реактивными данными</h3>
<p>ref() и reactive() - основные функции для создания реактивных данных в Vue 3.</p>
<pre><code>import { ref, reactive } from 'vue'

// Для примитивов
const name = ref('John')

// Для объектов
const user = reactive({
  name: 'John',
  age: 30
})</code></pre>`,
          order: 2,
        },
        {
          title: "Computed свойства",
          content: `<h3>Вычисляемые свойства</h3>
<p>computed() позволяет создавать производные значения, которые автоматически обновляются при изменении зависимостей.</p>
<pre><code>import { ref, computed } from 'vue'

const price = ref(100)
const tax = ref(0.2)

const totalPrice = computed(() => {
  return price.value * (1 + tax.value)
})</code></pre>`,
          order: 3,
        },
      ],
      testQuestions: [
        {
          question:
            "Какая функция используется для создания реактивных примитивов в Vue 3?",
          type: "single",
          order: 1,
          answers: [
            { answer: "ref()", isCorrect: true, order: 1 },
            { answer: "reactive()", isCorrect: false, order: 2 },
            { answer: "computed()", isCorrect: false, order: 3 },
            { answer: "watch()", isCorrect: false, order: 4 },
          ],
        },
        {
          question: "Что возвращает функция computed()?",
          type: "single",
          order: 2,
          answers: [
            { answer: "Реактивную ссылку", isCorrect: false, order: 1 },
            { answer: "Вычисляемое свойство", isCorrect: true, order: 2 },
            { answer: "Функцию-наблюдатель", isCorrect: false, order: 3 },
            { answer: "Объект с методами", isCorrect: false, order: 4 },
          ],
        },
      ],
    },
    {
      title: "Nuxt 3: Создание API endpoints",
      description: "Научитесь создавать серверные API endpoints в Nuxt 3",
      difficulty: "intermediate",
      category: "nuxt",
      duration: "30 мин",
      features: ["Nuxt 3", "API", "Server Routes"],
      order: 2,
      steps: [
        {
          title: "Структура server/ папки",
          content: `<h3>Организация API в Nuxt 3</h3>
<p>В Nuxt 3 API endpoints создаются в папке server/api/. Каждый файл автоматически становится доступным по соответствующему маршруту.</p>
<pre><code>server/
  api/
    users.get.ts      // GET /api/users
    users.post.ts     // POST /api/users
    users/[id].get.ts // GET /api/users/123</code></pre>`,
          order: 1,
        },
        {
          title: "Создание GET endpoint",
          content: `<h3>Простой GET endpoint</h3>
<p>Создадим простой endpoint для получения списка пользователей.</p>
<pre><code>// server/api/users.get.ts
export default defineEventHandler(async (event) => {
  return {
    users: [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' }
    ]
  }
})</code></pre>`,
          order: 2,
        },
        {
          title: "Обработка POST запросов",
          content: `<h3>Создание POST endpoint</h3>
<p>Научимся обрабатывать POST запросы и получать данные из тела запроса.</p>
<pre><code>// server/api/users.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  // Валидация данных
  if (!body.name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name is required'
    })
  }
  
  // Создание пользователя
  return { success: true, user: body }
})</code></pre>`,
          order: 3,
        },
      ],
      testQuestions: [
        {
          question: "В какой папке создаются API endpoints в Nuxt 3?",
          type: "single",
          order: 1,
          answers: [
            { answer: "pages/api/", isCorrect: false, order: 1 },
            { answer: "server/api/", isCorrect: true, order: 2 },
            { answer: "api/", isCorrect: false, order: 3 },
            { answer: "routes/", isCorrect: false, order: 4 },
          ],
        },
        {
          question: "Какие HTTP методы поддерживаются в Nuxt 3 API?",
          type: "multiple",
          order: 2,
          answers: [
            { answer: "GET", isCorrect: true, order: 1 },
            { answer: "POST", isCorrect: true, order: 2 },
            { answer: "PUT", isCorrect: true, order: 3 },
            { answer: "DELETE", isCorrect: true, order: 4 },
          ],
        },
      ],
    },
  ];

  for (const tutorial of tutorials) {
    const createdTutorial = await prisma.tutorial.create({
      data: {
        title: tutorial.title,
        description: tutorial.description,
        difficulty: tutorial.difficulty,
        category: tutorial.category,
        duration: tutorial.duration,
        features: tutorial.features,
        order: tutorial.order,
      },
    });

    // Создаем шаги туториала
    for (const step of tutorial.steps) {
      await prisma.tutorialStep.create({
        data: {
          tutorialId: createdTutorial.id,
          title: step.title,
          content: step.content,
          order: step.order,
        },
      });
    }

    // Создаем вопросы теста
    for (const question of tutorial.testQuestions) {
      const createdQuestion = await prisma.tutorialTestQuestion.create({
        data: {
          tutorialId: createdTutorial.id,
          question: question.question,
          type: question.type,
          order: question.order,
        },
      });

      // Создаем ответы на вопрос
      for (const answer of question.answers) {
        await prisma.tutorialTestAnswer.create({
          data: {
            questionId: createdQuestion.id,
            answer: answer.answer,
            isCorrect: answer.isCorrect,
            order: answer.order,
          },
        });
      }
    }
  }

  console.log("Туториалы созданы!");
  console.log("База данных полностью заполнена!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
