import type { PublicProjectCaseStudy } from "~/types/project-case-study";

/**
 * Curated public case metadata, keyed by the stable Project id from production.
 * Internal evidence and confidence stay in docs/portfolio-project-evidence.md.
 */
export const projectCaseStudies: Record<string, PublicProjectCaseStudy> = {
  cmm7zid0n0004o301rk66jffv: {
    ownershipType: "OWN",
    projectSummary:
      "Личное портфолио и веб-платформа с публичными разделами, API и административными инструментами.",
    role: "Основной разработчик",
    responsibilities: [
      "Разработал публичное приложение и серверные API на Nuxt/Nitro.",
      "Реализовал модели данных и работу с PostgreSQL через Prisma.",
      "Интегрировал авторизацию и Telegram-сценарии; подготовил Docker-развёртывание.",
    ],
    technicalHighlights: [
      "Nuxt 3, Vue 3 и TypeScript",
      "Nitro API, PostgreSQL и Prisma",
      "Docker, Nginx и Telegram Bot API",
    ],
    technologies: [
      "Nuxt 3",
      "Vue 3",
      "TypeScript",
      "Nitro",
      "Prisma",
      "PostgreSQL",
      "Docker",
      "Nginx",
      "Telegram Bot API",
    ],
    productionUrl: "https://kiruhak11.ru",
    repositoryUrl: "https://github.com/kiruhak11/kiruhak",
  },
  cmewb3qvv0003o11ge17zb005: {
    ownershipType: "PARTICIPATION",
    projectSummary:
      "Официальный сайт котельного завода с каталогом оборудования и формами обращений.",
    role: "Разработчик веб-сайта",
    company: "КотлоЭнергоСнаб",
    responsibilities: [
      "Разрабатывал страницы сайта и каталог продукции на Nuxt 3.",
      "Реализовал серверные маршруты для каталога, заявок и уведомлений.",
      "Работал с Prisma-моделями и MySQL-схемой проекта.",
    ],
    technicalHighlights: [
      "Nuxt SSR и SEO-структура сайта",
      "Каталог с API и Prisma/MySQL",
      "Telegram-уведомления по обращениям",
    ],
    technologies: ["Nuxt 3", "Vue 3", "Prisma", "MySQL", "Telegram Bot API"],
    productionUrl: "https://kes-sib.ru",
    repositoryUrl: "https://github.com/kiruhak11/kes",
  },
  cmm7z9yya0003o3013vri6scs: {
    ownershipType: "PARTICIPATION",
    projectSummary:
      "Сайт оконного мастера в Барнауле с услугами, контактами и формой заявки.",
    role: "Разработчик веб-сайта",
    company: "Частный мастер по ремонту окон",
    responsibilities: [
      "Реализовал страницу услуг и адаптивный интерфейс на Nuxt 4/Vue 3.",
      "Подключил серверную обработку формы и Telegram-уведомления.",
      "Настроил контентную структуру и технические SEO-файлы.",
    ],
    technicalHighlights: [
      "Nuxt 4 и TypeScript",
      "Server API для заявок",
      "XML-фиды, robots.txt и sitemap",
    ],
    technologies: ["Nuxt 4", "Vue 3", "TypeScript", "SCSS", "Telegram Bot API"],
    productionUrl: "https://okna-brn.ru",
    repositoryUrl: "https://github.com/kiruhak11/okna",
  },
  cmmth95p90000qp017bjtfbkt: {
    ownershipType: "PARTICIPATION",
    projectSummary:
      "Сайт кондитерского бренда с каталогом десертов, галереей, заказами и административной частью.",
    role: "Fullstack-разработчик",
    company: "Бренд «МАЛИНА»",
    responsibilities: [
      "Разрабатывал каталог, страницы продукта и галерею на Nuxt 4/Vue 3.",
      "Реализовал серверные API и работу с PostgreSQL через Prisma.",
      "Добавил инструменты администрирования и Telegram-сценарии для заявок и отзывов.",
    ],
    technicalHighlights: [
      "Nuxt 4 server API и Prisma/PostgreSQL",
      "CRUD для каталога и отзывов",
      "Отдельный Telegram bot service",
    ],
    technologies: [
      "Nuxt 4",
      "Vue 3",
      "TypeScript",
      "Prisma",
      "PostgreSQL",
      "Docker",
      "Telegram Bot API",
    ],
    productionUrl: "https://malina14.ru",
    repositoryUrl: "https://github.com/kiruhak11/malina",
  },
  cmewb3qw10005o11gpf3x0vtn: {
    ownershipType: "UNVERIFIED",
    projectSummary:
      "Приложение для отображения расписания промышленных миксеров и экспорта отчёта.",
    responsibilities: [],
    technicalHighlights: [],
    technologies: [],
    productionUrl: null,
    repositoryUrl: null,
  },
  cmqun63t30000me01yu4r2iax: {
    ownershipType: "UNVERIFIED",
    projectSummary:
      "Интернет-магазин с каталогом товаров, корзиной и личным кабинетом.",
    responsibilities: [],
    technicalHighlights: [],
    technologies: [],
    productionUrl: null,
    repositoryUrl: null,
  },
  cmowkh9cv0002qp014udt4cdl: {
    ownershipType: "UNVERIFIED",
    projectSummary:
      "Промо-сайт игры OVERHEAT с информацией об игре и релизных материалах.",
    responsibilities: [],
    technicalHighlights: [],
    technologies: [],
    productionUrl: null,
    repositoryUrl: null,
  },
  cmowkemul0001qp01741xqdo9: {
    ownershipType: "UNVERIFIED",
    projectSummary:
      "Сайт строительной компании с перечнем услуг и примерами работ.",
    responsibilities: [],
    technicalHighlights: [],
    technologies: [],
    productionUrl: "https://remdom22.ru",
    repositoryUrl: null,
  },
};

export function getProjectCaseStudy(projectId: string) {
  return projectCaseStudies[projectId] ?? null;
}
