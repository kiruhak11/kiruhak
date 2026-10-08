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
import { getFeaturedPortfolioProjects } from "../utils/featured-projects";
import { getVerifiedProjectLinks } from "../utils/project-case-links";
import { groupProjectsByOwnership } from "../utils/project-ownership";
import { formatConfirmedCaseCount } from "../utils/project-count";
import { toPublicProject } from "../server/utils/public-project";

test("public navigation only promotes portfolio routes", () => {
  assert.deepEqual(
    publicNavigation.map(({ to }) => to),
    ["/projects", "/contact"]
  );
  assert.ok(!publicNavigation.some(({ to }) => ["/analytics", "/content", "/login"].includes(to)));
});

test("confirmed project count uses correct Russian plural forms", () => {
  const expected = new Map([
    [0, "0 подтверждённых кейсов"],
    [1, "1 подтверждённый кейс"],
    [2, "2 подтверждённых кейса"],
    [4, "4 подтверждённых кейса"],
    [5, "5 подтверждённых кейсов"],
    [11, "11 подтверждённых кейсов"],
    [14, "14 подтверждённых кейсов"],
    [21, "21 подтверждённый кейс"],
    [22, "22 подтверждённых кейса"],
    [25, "25 подтверждённых кейсов"],
  ]);

  for (const [count, label] of expected) {
    assert.equal(formatConfirmedCaseCount(count), label);
  }
});

test("project case modal is portaled to the document body and keeps its interaction hooks", () => {
  const modal = readFileSync(new URL("../components/ProjectModal.vue", import.meta.url), "utf8");
  const projectsPage = readFileSync(new URL("../pages/projects.vue", import.meta.url), "utf8");

  assert.match(modal, /<Teleport\s+to="body">[\s\S]*?class="project-modal-overlay"[\s\S]*?<\/Teleport>/);
  assert.match(modal, /window\.addEventListener\("keydown", handleModalKeydown\)/);
  assert.match(modal, /closeButton\.value\?\.focus\(\)/);
  assert.match(modal, /previousFocus\?\.focus\(\)/);
  assert.match(modal, /document\.body\.classList\.add\("no-scroll"\)/);
  assert.match(modal, /document\.body\.classList\.remove\("no-scroll"\)/);
  assert.match(projectsPage, /<ProjectModal[\s\S]*?v-if="selectedProject"[\s\S]*?@close="closeProjectModal"/);
});

test("public contact data is centralized and points to one profile", () => {
  assert.equal(publicContact.email.href, "mailto:web@kiruhak11.ru");
  assert.equal(publicContact.telegram.href, "https://t.me/kiruhak11");
  assert.equal(publicContact.github.href, "https://github.com/kiruhak11");
  assert.equal(publicContact.vk.href, "https://vk.com/kiruhak11");
});

test("contact experience uses canonical channels and keeps platform access secondary", () => {
  const contactPage = readFileSync(new URL("../pages/contact.vue", import.meta.url), "utf8");
  const footer = readFileSync(new URL("../layouts/default.vue", import.meta.url), "utf8");
  const home = readFileSync(new URL("../pages/index.vue", import.meta.url), "utf8");

  assert.match(contactPage, /publicContact\.telegram\.href/);
  assert.match(contactPage, /publicContact\.email\.href/);
  assert.match(contactPage, /publicContact\.github\.href/);
  assert.match(contactPage, /to="\/#application-form"/);
  assert.doesNotMatch(contactPage, /<form|publicContact\.phone|publicContact\.vk/);
  assert.match(footer, /publicContact\.telegram\.href/);
  assert.match(footer, /publicContact\.email\.href/);
  assert.match(footer, /publicContact\.github\.href/);
  assert.match(footer, /to="\/login"/);
  assert.doesNotMatch(footer, /K-Studio|\/analytics|\/content|\/admin|\/tutorials|\/materials/);
  assert.match(footer, /portfolio-current-year/);
  assert.match(home, /publicContact\.telegram\.href/);
  assert.match(home, /publicContact\.email\.href/);
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

test("project preview URLs allow safe local assets without loosening external links", () => {
  assert.equal(isUsableProjectPreview("https://github.com/kiruhak11/lexid"), false);
  assert.equal(
    isUsableProjectPreview("https://ltdfoto.ru/images/2026/05/19/AVATARKA.png"),
    true
  );
  assert.equal(isUsableProjectPreview("/images/projects/k-studio.webp"), true);
  assert.equal(isUsableProjectPreview("//evil.example/image.png"), false);
  assert.equal(isUsableProjectPreview("/images/../secret.png"), false);
  assert.equal(isUsableProjectPreview("/images/%2e%2e/secret.png"), false);
  assert.equal(isUsableProjectPreview("/images/%ZZ.png"), false);
  assert.equal(isUsableProjectPreview("/images\\evil.png"), false);
  assert.equal(isUsableProjectPreview("javascript:alert(1)"), false);
  assert.equal(isUsableProjectPreview("data:image/png;base64,AAAA"), false);
  assert.equal(isUsableProjectPreview("file:///etc/passwd"), false);
  assert.equal(isUsableProjectPreview("ftp://example.com/image.png"), false);
  assert.equal(isUsableProjectPreview("https://["), false);
  assert.equal(isUsableProjectPreview(""), false);
  assert.equal(isUsableProjectPreview("   "), false);
  assert.deepEqual(
    getProjectExternalLinks({ liveUrl: "/projects", githubUrl: "/repo" }),
    { liveUrl: null, githubUrl: null }
  );
});

test("reviewed project previews resolve to safe same-origin image paths", () => {
  const previews = [
    ["cmm7zid0n0004o301rk66jffv", "/images/projects/k-studio.webp"],
    ["cmewb3qvv0003o11ge17zb005", "/images/projects/kes.webp"],
    ["cmm7z9yya0003o3013vri6scs", "/images/projects/okna.webp"],
    ["cmmth95p90000qp017bjtfbkt", "/images/projects/malina.webp"],
  ] as const;

  for (const [id, expectedImage] of previews) {
    const project = toPublicProject({ id });
    assert.equal(project.image, expectedImage);
    assert.equal(isUsableProjectPreview(project.image), true);
  }
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

test("OWN, CLIENT, PARTICIPATION, and UNVERIFIED have evidence-backed exclusive categories", () => {
  const records = Object.values(projectCaseStudies);
  assert.equal(records.filter((record) => record.ownershipType === "OWN").length, 1);
  assert.equal(records.filter((record) => record.ownershipType === "CLIENT").length, 4);
  assert.equal(records.filter((record) => record.ownershipType === "PARTICIPATION").length, 0);
  assert.equal(records.filter((record) => record.ownershipType === "UNVERIFIED").length, 3);
  assert.ok(records.every((record) => record.ownershipType !== "UNVERIFIED" || !record.role));
  assert.ok(records.every((record) => record.ownershipType !== "UNVERIFIED" || record.responsibilities.length === 0));
  assert.ok(
    !projectCaseStudies.cmewb3qw10005o11gpf3x0vtn.technologies.length,
    "unverified projects must not inherit unreviewed legacy stack claims"
  );
});

test("project list grouping preserves all ownership categories and fails closed", () => {
  const projects: Array<{ id: string; caseStudy?: (typeof projectCaseStudies)[string] }> = Object.entries(projectCaseStudies).map(([id, caseStudy]) => ({ id, caseStudy }));
  const grouped = groupProjectsByOwnership([...projects, { id: "missing-metadata" }]);

  assert.equal(grouped.OWN.length, 1);
  assert.equal(grouped.CLIENT.length, 4);
  assert.equal(grouped.PARTICIPATION.length, 0);
  assert.equal(grouped.UNVERIFIED.length, 4);
  assert.ok(grouped.UNVERIFIED.every((project) => project.caseStudy?.ownershipType === "UNVERIFIED" || !project.caseStudy));
});

test("case links only come from verified project metadata", () => {
  assert.deepEqual(
    getVerifiedProjectLinks({ caseStudy: projectCaseStudies.cmewb3qvv0003o11ge17zb005 }),
    { liveUrl: "https://kes-sib.ru/", githubUrl: "https://github.com/kiruhak11/kes" }
  );
  assert.deepEqual(
    getVerifiedProjectLinks({
      caseStudy: {
        ...projectCaseStudies.cmewb3qw10005o11gpf3x0vtn,
        productionUrl: "https://unverified.example",
        repositoryUrl: "https://github.com/unverified/repo",
      },
    }),
    { liveUrl: null, githubUrl: null }
  );
});

test("homepage featured cases require featured status, verified ownership, and production URL", () => {
  const base = {
    featured: true,
    caseStudy: { ownershipType: "OWN", productionUrl: "https://example.test" },
  };
  const selected = getFeaturedPortfolioProjects([
    { id: "selected", ...base },
    { id: "client", ...base, caseStudy: { ownershipType: "CLIENT", productionUrl: "https://example.test" } },
    { id: "not-featured", ...base, featured: false },
    { id: "unverified", ...base, caseStudy: { ownershipType: "UNVERIFIED", productionUrl: "https://example.test" } },
    { id: "no-production", ...base, caseStudy: { ownershipType: "PARTICIPATION", productionUrl: null } },
  ]);

  assert.deepEqual(selected.map(({ id }) => id), ["selected", "client"]);
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

test("persisted case study is the public source of truth and admin fields stay private", () => {
  const output = toPublicProject({
    id: "persisted-case-study",
    title: "Persisted case",
    description: "legacy description",
    shortDescription: "legacy short description",
    image: "/image.webp",
    technologies: ["Nuxt"],
    category: "web",
    featured: true,
    order: 0,
    ownershipType: "PARTICIPATION",
    projectSummary: "Описание продукта из БД",
    role: "Frontend Developer",
    company: "Команда",
    responsibilities: ["Реализовал интерфейс"],
    technicalHighlights: ["SSR"],
  });
  assert.equal(output.caseStudy.projectSummary, "Описание продукта из БД");
  assert.equal(output.caseStudy.role, "Frontend Developer");
  assert.deepEqual(output.caseStudy.responsibilities, ["Реализовал интерфейс"]);
  assert.equal("ownershipType" in output, false);
  assert.equal("responsibilities" in output, false);
});

test("UNVERIFIED stored projects expose no unconfirmed claims or links", () => {
  const output = toPublicProject({
    id: "unverified-case-study",
    title: "Unverified",
    description: "legacy",
    shortDescription: "legacy",
    image: "/image.webp",
    technologies: ["secret stack"],
    category: "web",
    featured: true,
    order: 0,
    liveUrl: "https://unconfirmed.example",
    githubUrl: "https://github.com/unconfirmed/repo",
    ownershipType: "UNVERIFIED",
    projectSummary: "Кратко о продукте",
    role: "secret role",
    company: "secret company",
    responsibilities: ["secret contribution"],
    technicalHighlights: ["secret details"],
  });
  assert.equal(output.caseStudy.ownershipType, "UNVERIFIED");
  assert.equal(output.caseStudy.role, undefined);
  assert.deepEqual(output.caseStudy.responsibilities, []);
  assert.deepEqual(output.technologies, []);
  assert.equal(output.liveUrl, null);
  assert.equal(output.githubUrl, null);
  assert.equal(output.featured, false);
  assert.equal(JSON.stringify(output).includes("secret"), false);
});

test("case modal supports roles/contributions while unverified entries receive no role badge", () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
  const modal = read("../components/ProjectModal.vue");
  const card = read("../components/ProjectCard.vue");

  assert.match(modal, /Моя роль/);
  assert.match(modal, /caseView\.contributionLabel/);
  assert.match(modal, /ownershipType === 'CLIENT'/);
  assert.match(modal, /technicalHighlights/);
  assert.match(modal, /ownershipType === 'UNVERIFIED'/);
  assert.match(card, /caseView\.ownershipType !== 'UNVERIFIED'/);
  assert.match(modal, /role="dialog"/);
  assert.match(modal, /aria-modal="true"/);
  assert.match(modal, /handleModalKeydown/);
  assert.match(card, /Открыть сайт/);
  assert.match(card, /noopener noreferrer/);
});

test("project media retains lazy loading, stable intrinsic size, and visible fallback", () => {
  const preview = readFileSync(new URL("../components/ProjectPreview.vue", import.meta.url), "utf8");
  const card = readFileSync(new URL("../components/ProjectCard.vue", import.meta.url), "utf8");
  const modal = readFileSync(new URL("../components/ProjectModal.vue", import.meta.url), "utf8");
  assert.match(preview, /priority \? 'eager' : 'lazy'/);
  assert.match(preview, /width="1600"/);
  assert.match(preview, /height="790"/);
  assert.match(preview, /decoding="async"/);
  assert.match(preview, /превью недоступно/i);
  assert.match(card, /aspect-ratio: 2 \/ 1/);
  assert.match(modal, /aspect-ratio: 2 \/ 1/);
});

test("three ownership tabs are always available and keyboard operable; unverified items stay separate", () => {
  const page = readFileSync(new URL("../pages/projects.vue", import.meta.url), "utf8");
  const gallery = readFileSync(new URL("../components/InteractiveGallery.vue", import.meta.url), "utf8");
  assert.match(page, /label: "Мои проекты"/);
  assert.match(page, /label: "Клиентские проекты"/);
  assert.match(page, /label: "Участие в проектах"/);
  assert.match(page, /role="tablist"/);
  assert.match(page, /role="tabpanel"/);
  assert.match(page, /ArrowLeft/);
  assert.match(page, /Home/);
  assert.match(page, /End/);
  assert.match(page, /@keydown="handleTabKeydown/);
  assert.match(page, /ArrowRight/);
  assert.match(page, /details v-if="unverifiedProjects\.length"/);
  assert.match(page, /Архив проектов/);
  assert.match(page, /не публикую сведения о своей роли, вкладе и стеке/);
  assert.doesNotMatch(page, /searchQuery|selectedCategory|sortBy/);
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
  const hamburger = read("../components/HamburgerMenu.vue");
  const publicCopy = [homepage, projectPage, contactPage, app, footer].join("\n");

  assert.match(homepage, /Кирилл Коваленко/);
  assert.match(homepage, /Посмотреть проекты/);
  assert.doesNotMatch(publicCopy, /K-Studio — корпоративная веб|наша команда|мы создаём|мы создаем/i);
  assert.doesNotMatch(homepage + projectPage + projectModal, /project\.results|caseItem\.result/);
  assert.doesNotMatch(projectPage + contactPage, /Поддержать проект|handleDonationClick/);
  assert.match(contactPage, /отвечаю лично/);
  assert.match(hamburger, /\.mobile-menu-backdrop\s*\{[^}]*font-family:\s*var\(--portfolio-font-sans\)/s);
  assert.doesNotMatch([homepage, projectModal, hamburger].join("\n"), /CASE STUDY|\bSTACK\b|\bPRODUCTION\b|\bProduction\b/);
});
