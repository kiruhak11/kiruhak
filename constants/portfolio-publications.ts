export const portfolioPublications = [
  {
    id: "cmm7zid0n0004o301rk66jffv",
    slug: "k-studio",
    cover: { src: "/images/projects/k-studio.webp", width: 1600, height: 790, alt: "Фирменная обложка портфолио K-Studio" },
    task: "Собрать портфолио, публикации и форму обращения на одной веб-платформе с инструментами управления содержимым.",
    outcome: "В открытой части доступны проекты, материалы и форма связи. Содержимое сайта управляется из административной панели.",
  },
  {
    id: "cmewb3qvv0003o11ge17zb005",
    slug: "kes",
    cover: { src: "/images/projects/kes.webp", width: 1600, height: 789, alt: "Фирменная обложка сайта КотлоЭнергоСнаб с котельным оборудованием" },
    task: "Представить котельное оборудование и его характеристики в веб-каталоге и дать покупателю возможность отправить обращение.",
    outcome: "На сайте можно просмотреть каталог оборудования и отправить обращение через форму.",
  },
  {
    id: "cmm7z9yya0003o3013vri6scs",
    slug: "okna-brn",
    cover: { src: "/images/projects/okna.webp", width: 1600, height: 789, alt: "Обложка сайта Оконного мастера с фотографией ремонта окна" },
    task: "Собрать услуги по ремонту окон, цены и контакты мастера на одной странице с формой заявки.",
    outcome: "Посетитель может посмотреть услуги и цены, найти контакты мастера и оставить заявку с телефона.",
  },
  {
    id: "cmmth95p90000qp017bjtfbkt",
    slug: "malina",
    cover: { src: "/images/projects/malina.webp", width: 446, height: 220, alt: "Фирменная обложка МАЛИНА с логотипом и названиями десертов" },
    task: "Представить ассортимент кондитерского бренда, собрать заявки и отзывы и дать владельцу возможность обновлять каталог.",
    outcome: "На сайте доступны каталог десертов, галерея, формы заказа и отзыва. Каталог и отзывы управляются из административной части.",
  },
] as const;

export const portfolioOpenGraphCover = portfolioPublications[0].cover;

export function getPortfolioPublicationBySlug(slug: string) {
  return portfolioPublications.find((item) => item.slug === slug);
}

export function getPortfolioPublication(id: string, ownershipType?: string | null) {
  if (ownershipType !== "OWN" && ownershipType !== "CLIENT" && ownershipType !== "PARTICIPATION") return undefined;
  return portfolioPublications.find((item) => item.id === id);
}

export function getPortfolioCover(src?: string | null) {
  return portfolioPublications.find((item) => item.cover.src === src)?.cover;
}

export function portfolioCasePath(slug: string) {
  return `/projects/${slug}`;
}
