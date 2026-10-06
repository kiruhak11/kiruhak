import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { publicContact } from "../constants/public-contact";
import { projectCaseStudies } from "../constants/project-case-studies";
import { publicNavigation } from "../constants/public-navigation";
import {
  getProjectExternalLinks,
  isUsableProjectPreview,
} from "../utils/project-links";
import { getProjectCaseView } from "../utils/project-case-view";
import { toPublicProject } from "../server/utils/public-project";

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
    id: "cmm7zid0n0004o301rk66jffv",
    title: "K-Studio",
    description: "Legacy database text.",
    shortDescription: "Legacy summary.",
    image: "",
    technologies: ["Nuxt", "TypeScript"],
    category: "Application",
    features: ["Schedule", "PDF export"],
    results: "Reduced planning time by 90%.",
    featured: false,
    order: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    caseStudy: projectCaseStudies.cmm7zid0n0004o301rk66jffv,
  });

  assert.equal(view.ownershipType, "OWN");
  assert.match(view.productSummary, /личное портфолио/i);
  assert.ok(view.responsibilities.length > 0);
  assert.ok(!("result" in view));
  assert.ok(!Object.values(view).some((value) => String(value).includes("90%")));
});

test("OWN, PARTICIPATION, and UNVERIFIED have evidence-backed exclusive categories", () => {
  const records = Object.values(projectCaseStudies);
  assert.equal(records.filter((record) => record.ownershipType === "OWN").length, 1);
  assert.equal(records.filter((record) => record.ownershipType === "PARTICIPATION").length, 3);
  assert.equal(records.filter((record) => record.ownershipType === "UNVERIFIED").length, 4);
  assert.ok(records.every((record) => record.ownershipType !== "UNVERIFIED" || !record.role));
  assert.ok(records.every((record) => record.ownershipType !== "UNVERIFIED" || record.responsibilities.length === 0));
  assert.ok(
    !projectCaseStudies.cmewb3qw10005o11gpf3x0vtn.technologies.length,
    "unverified projects must not inherit unreviewed legacy stack claims"
  );
});

test("public project adapter sanitizes legacy claims and fails closed for unknown records", () => {
  const base = {
    id: "cmm7zid0n0004o301rk66jffv",
    title: "K-Studio",
    description: "Legacy description",
    shortDescription: "Legacy summary",
    image: "https://ltdfoto.ru/project.png",
    technologies: ["Unknown legacy stack"],
    category: "Portfolio",
    client: "Legacy client",
    duration: "2 months",
    budget: "100,000 ₽",
    features: ["Legacy feature"],
    challenges: "Legacy challenge",
    solutions: "Unsupported personal claim",
    results: "90% result",
    liveUrl: "https://wrong.example",
    githubUrl: "https://github.com/unrelated/repo",
    featured: true,
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const publicProject = toPublicProject(base);
  assert.equal(publicProject.caseStudy.ownershipType, "OWN");
  assert.equal(publicProject.results, null);
  assert.equal(publicProject.challenges, null);
  assert.equal(publicProject.solutions, null);
  assert.equal(publicProject.budget, null);
  assert.deepEqual(publicProject.technologies, projectCaseStudies[base.id].technologies);
  assert.equal(JSON.stringify(publicProject).includes("90% result"), false);
  assert.equal(JSON.stringify(publicProject).includes("confidence"), false);

  const unknown = toPublicProject({ ...base, id: "future-seed-record" });
  assert.equal(unknown.caseStudy.ownershipType, "UNVERIFIED");
  assert.equal(unknown.githubUrl, null);
  assert.deepEqual(unknown.technologies, []);
  assert.equal(unknown.solutions, null);
});

test("case modal supports roles/contributions while unverified entries receive no role badge", () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
  const modal = read("../components/ProjectModal.vue");
  const card = read("../components/ProjectCard.vue");

  assert.match(modal, /Моя роль/);
  assert.match(modal, /Мой вклад/);
  assert.match(modal, /technicalHighlights/);
  assert.match(modal, /ownershipType === 'UNVERIFIED'/);
  assert.match(card, /ownershipType !== 'UNVERIFIED'/);
});

test("ownership tabs are conditional and keyboard operable; unverified items stay separate", () => {
  const page = readFileSync(new URL("../pages/projects.vue", import.meta.url), "utf8");
  const gallery = readFileSync(new URL("../components/InteractiveGallery.vue", import.meta.url), "utf8");
  assert.match(page, /v-if="ownProjects\.length && participationProjects\.length"/);
  assert.match(page, /@keydown="handleTabKeydown/);
  assert.match(page, /ArrowRight/);
  assert.match(page, /details v-if="unverifiedProjects\.length"/);
  assert.match(page, /не отношу их ни к собственным проектам/);
  assert.doesNotMatch(gallery, /Проект 2|Проект 3|Проект 4/);
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
