import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { publicContact } from "../constants/public-contact";
import { publicNavigation } from "../constants/public-navigation";
import {
  getProjectExternalLinks,
  isUsableProjectPreview,
} from "../utils/project-links";
import { getProjectCaseView } from "../utils/project-case-view";

test("public navigation only promotes portfolio routes", () => {
  assert.deepEqual(
    publicNavigation.map(({ to }) => to),
    ["/projects", "/contact"]
  );
  assert.ok(!publicNavigation.some(({ to }) => ["/analytics", "/content", "/login"].includes(to)));
});

test("public contact data is centralized and points to one profile", () => {
  assert.equal(publicContact.email.href, "mailto:web@kiruhak11.ru");
  assert.equal(publicContact.telegram.href, "https://t.me/kiruhak11");
  assert.equal(publicContact.github.href, "https://github.com/kiruhak11");
  assert.equal(publicContact.vk.href, "https://vk.com/kiruhak11");
});

test("project links suppress repository URLs masquerading as production sites", () => {
  assert.deepEqual(
    getProjectExternalLinks({
      liveUrl: "https://github.com/kiruhak11/OVERHEAT",
      githubUrl: "https://github.com/kiruhak11/OVERHEAT",
    }),
    { liveUrl: null, githubUrl: null }
  );
  assert.deepEqual(
    getProjectExternalLinks({
      liveUrl: "https://kes-sib.ru",
      githubUrl: "https://github.ru/kiruhak11/kes",
    }),
    {
      liveUrl: "https://kes-sib.ru/",
      githubUrl: "https://github.com/kiruhak11/kes",
    }
  );
  assert.deepEqual(
    getProjectExternalLinks({ githubUrl: "https://github.com/kiruhak11/remdom" }),
    { liveUrl: null, githubUrl: null }
  );
});

test("project preview URLs reject repository pages and accept image URLs", () => {
  assert.equal(isUsableProjectPreview("https://github.com/kiruhak11/lexid"), false);
  assert.equal(
    isUsableProjectPreview("https://ltdfoto.ru/images/2026/05/19/AVATARKA.png"),
    true
  );
  assert.equal(isUsableProjectPreview("javascript:alert(1)"), false);
});

test("project case view separates product from implementation and omits unverified results", () => {
  const view = getProjectCaseView({
    id: "sample",
    title: "Planning app",
    description: "A scheduling app with PDF export.",
    shortDescription: "A scheduling app for an industrial team.",
    image: "",
    technologies: ["Nuxt", "TypeScript"],
    category: "Application",
    features: ["Schedule", "PDF export"],
    challenges: "Rotate equipment assignments by day.",
    solutions: "Implemented a repeatable rotation and PDF generation.",
    results: "Reduced planning time by 90%.",
    featured: false,
    order: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });

  assert.equal(view.productSummary, "A scheduling app for an industrial team.");
  assert.equal(view.contribution, "Implemented a repeatable rotation and PDF generation.");
  assert.ok(!("result" in view));
  assert.ok(!Object.values(view).some((value) => String(value).includes("90%")));
});

test("KES case stack follows its published repository schema rather than conflicting legacy copy", () => {
  const view = getProjectCaseView({
    id: "kes",
    title: "KES — КотлоЭнергоСнаб",
    description: "Corporate site.",
    shortDescription: "Boiler equipment catalogue.",
    image: "",
    technologies: ["Vue.js", "Nuxt 3", "Supabase", "Docker"],
    category: "Corporate site",
    features: [],
    featured: true,
    order: 1,
    githubUrl: "https://github.ru/kiruhak11/kes",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });

  assert.deepEqual(view.technologies, ["Vue.js", "Nuxt 3", "Docker", "Prisma", "MySQL"]);
});

test("key public copy is personal and does not surface unsupported result sections", () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
  const homepage = read("../pages/index.vue");
  const projectPage = read("../pages/projects.vue");
  const contactPage = read("../pages/contact.vue");
  const projectModal = read("../components/ProjectModal.vue");
  const app = read("../app.vue");
  const footer = read("../layouts/default.vue");
  const publicCopy = [homepage, projectPage, contactPage, app, footer].join("\n");

  assert.match(homepage, /Кирилл Коваленко/);
  assert.match(homepage, /Посмотреть проекты/);
  assert.doesNotMatch(publicCopy, /K-Studio — корпоративная веб|наша команда|мы создаём|мы создаем/i);
  assert.doesNotMatch(homepage + projectPage + projectModal, /project\.results|caseItem\.result/);
  assert.doesNotMatch(projectPage + contactPage, /Поддержать проект|handleDonationClick/);
  assert.match(contactPage, /Напишите мне напрямую/);
});
