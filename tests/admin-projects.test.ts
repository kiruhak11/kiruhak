import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parseProjectInput } from "../server/utils/project-input";
import { requireAdmin } from "../server/utils/require-admin";
import { toPublicProject } from "../server/utils/public-project";

const base = { title: "Case", shortDescription: "Summary", description: "Summary", image: "/images/case.webp", category: "web" };

test("admin project API requires an authenticated administrator", () => {
  assert.throws(() => requireAdmin(null), (error: { statusCode?: number }) => error.statusCode === 401);
  assert.throws(() => requireAdmin({ isAdmin: false }), (error: { statusCode?: number }) => error.statusCode === 403);
  assert.equal(requireAdmin({ isAdmin: true }).isAdmin, true);
});

test("OWN, CLIENT, and PARTICIPATION project inputs enforce their required case study fields", () => {
  const own = parseProjectInput({ ...base, ownershipType: "OWN", projectSummary: "About the product", role: "Developer", responsibilities: ["Built the app"], technologies: ["Nuxt"] });
  assert.equal(own.ownershipType, "OWN");
  const participation = parseProjectInput({ ...base, ownershipType: "PARTICIPATION", projectSummary: "About the product", role: "Frontend", responsibilities: ["Built a part"], company: "Team" });
  assert.equal(participation.ownershipType, "PARTICIPATION");
  const client = parseProjectInput({ ...base, ownershipType: "CLIENT", projectSummary: "Client product", role: "Fullstack developer", responsibilities: ["Built the whole site"] });
  assert.equal(client.ownershipType, "CLIENT");
  assert.equal(client.company, null);
  assert.throws(() => parseProjectInput({ ...base, ownershipType: "OWN", projectSummary: "About", role: "Developer", responsibilities: ["Built it"] }), (error: { statusCode?: number }) => error.statusCode === 400);
  assert.throws(() => parseProjectInput({ ...base, ownershipType: "PARTICIPATION", projectSummary: "About", responsibilities: ["Built it"] }), (error: { statusCode?: number }) => error.statusCode === 400);
  assert.throws(() => parseProjectInput({ ...base, ownershipType: "CLIENT", projectSummary: "About", role: "Developer" }), (error: { statusCode?: number }) => error.statusCode === 400);
});

test("CLIENT case study is public and remains distinct from team participation", () => {
  const output = toPublicProject({
    id: "qa-client", title: "Client case", description: "Site", shortDescription: "Site", image: "/images/case.webp", category: "web",
    ownershipType: "CLIENT", projectSummary: "Client site", role: "Fullstack developer", company: "Client", responsibilities: ["Built the site"],
    technicalHighlights: ["SSR"], technologies: ["Nuxt"], liveUrl: "https://example.test", githubUrl: null, featured: true,
  });
  assert.equal(output.caseStudy.ownershipType, "CLIENT");
  assert.deepEqual(output.caseStudy.responsibilities, ["Built the site"]);
});

test("UNVERIFIED inputs may omit claims and malformed types or external URLs fail closed", () => {
  const unverified = parseProjectInput({ ...base, ownershipType: "UNVERIFIED", featured: true });
  assert.equal(unverified.ownershipType, "UNVERIFIED");
  assert.equal(unverified.featured, false);
  const minimal = parseProjectInput({ title: "Archived", image: "/images/archive.webp", category: "web", ownershipType: "UNVERIFIED" });
  assert.equal(minimal.description, "Описание проекта уточняется.");
  assert.throws(() => parseProjectInput({ ...base, ownershipType: "GUESSED" }), (error: { statusCode?: number }) => error.statusCode === 400);
  assert.throws(() => parseProjectInput({ ...base, ownershipType: "UNVERIFIED", liveUrl: "javascript:alert(1)" }), (error: { statusCode?: number }) => error.statusCode === 400);
  assert.throws(() => parseProjectInput({ ...base, ownershipType: "UNVERIFIED", image: "data:image/png;base64,AA" }), (error: { statusCode?: number }) => error.statusCode === 400);
  assert.throws(() => parseProjectInput({ ...base, ownershipType: "UNVERIFIED", image: "//evil.example/image.png" }), (error: { statusCode?: number }) => error.statusCode === 400);
  assert.throws(() => parseProjectInput({ ...base, ownershipType: "UNVERIFIED", image: "/images/../secret.png" }), (error: { statusCode?: number }) => error.statusCode === 400);
});

test("project input whitelists writable fields instead of accepting mass assignment", () => {
  const parsed = parseProjectInput({
    ...base,
    ownershipType: "OWN",
    projectSummary: "Product summary",
    role: "Developer",
    responsibilities: ["Built the app"],
    technologies: ["Nuxt"],
    isAdmin: true,
    password: "unexpected",
    arbitraryField: "unexpected",
  });
  assert.equal("isAdmin" in parsed, false);
  assert.equal("password" in parsed, false);
  assert.equal("arbitraryField" in parsed, false);
});

test("partial ownership downgrade preserves stored claims while hiding public output", () => {
  const update = parseProjectInput({ ownershipType: "UNVERIFIED" }, true);
  assert.deepEqual(update, { ownershipType: "UNVERIFIED", featured: false });
  assert.deepEqual(parseProjectInput({ featured: false }, true), { featured: false });
});

test("UNVERIFIED public output redacts stored summary and all authorship claims", () => {
  const output = toPublicProject({
    id: "qa-unverified",
    title: "Private test project",
    description: "Private product description",
    shortDescription: "Private product description",
    image: "/images/archive.webp",
    category: "web",
    ownershipType: "UNVERIFIED",
    projectSummary: "Private case-study summary",
    role: "Private role",
    company: "Private company",
    responsibilities: ["Private contribution"],
    technicalHighlights: ["Private decision"],
    technologies: ["Private stack"],
    liveUrl: "https://private.example",
    githubUrl: "https://github.com/private/repo",
    featured: true,
  });
  assert.equal(output.description, "Описание проекта уточняется.");
  assert.equal(output.caseStudy.projectSummary, "Описание проекта уточняется.");
  assert.equal(output.caseStudy.role, undefined);
  assert.deepEqual(output.caseStudy.responsibilities, []);
  assert.deepEqual(output.caseStudy.technicalHighlights, []);
  assert.deepEqual(output.caseStudy.technologies, []);
  assert.equal(output.caseStudy.productionUrl, null);
  assert.equal(output.caseStudy.repositoryUrl, null);
  assert.equal(output.featured, false);
});

test("case-study migration is explicitly transactional and non-destructive", () => {
  const migration = readFileSync(new URL("../prisma/migrations/20261007090000_persist_project_case_study/migration.sql", import.meta.url), "utf8").trim();
  assert.match(migration, /^BEGIN;[\s\S]*COMMIT;$/);
  assert.doesNotMatch(migration, /\bDROP\s+(?:TABLE|COLUMN)|\bDELETE\s+FROM|UPDATE\s+"public"\."projects"\s+SET\s+"id"/i);
  assert.match(migration, /'cmm7zid0n0004o301rk66jffv'/);
  assert.match(migration, /'cmowkemul0001qp01741xqdo9'/);
});

test("client reclassification migration only updates four exact ids and fails closed", () => {
  const migration = readFileSync(new URL("../prisma/migrations/20261008120000_reclassify_client_projects/migration.sql", import.meta.url), "utf8").trim();
  assert.match(migration, /^BEGIN;[\s\S]*COMMIT;$/);
  assert.match(migration, /COALESCE\("ownershipType", 'UNVERIFIED'\) NOT IN \('PARTICIPATION', 'CLIENT'\)/);
  assert.match(migration, /SET "ownershipType" = 'CLIENT'/);
  assert.doesNotMatch(migration, /SET\s+"(?:projectSummary|role|company|responsibilities|technicalHighlights|technologies|liveUrl|githubUrl)"/i);
  for (const id of ["cmewb3qvv0003o11ge17zb005", "cmm7z9yya0003o3013vri6scs", "cmmth95p90000qp017bjtfbkt", "cmowkemul0001qp01741xqdo9"]) assert.ok(migration.includes(id));
});

test("admin editors use one accessible dialog primitive with dirty-form safeguards", () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
  const dialog = read("../components/AdminDialog.vue");
  for (const path of ["../pages/admin/projects.vue", "../pages/admin/materials.vue", "../pages/admin/tutorials.vue"]) {
    const page = read(path);
    assert.match(page, /<AdminDialog/);
    assert.match(page, /несохранённые изменения/i);
    assert.doesNotMatch(page, /class="modal-overlay"/);
  }
  for (const path of ["../pages/admin/materials.vue", "../pages/admin/tutorials.vue"]) {
    const page = read(path);
    assert.match(page, /deleteDialogOpen/);
    assert.doesNotMatch(page, /confirm\("Вы уверены/);
  }
  assert.match(dialog, /role="dialog"/);
  assert.match(dialog, /aria-modal="true"/);
  assert.match(dialog, /event\.key === "Escape"/);
  assert.match(dialog, /event\.key !== "Tab"/);
  assert.match(dialog, /previousFocus\?\.focus\(\)/);
  assert.match(dialog, /document\.body\.style\.overflow = "hidden"/);
  assert.match(dialog, /100dvh/);
  assert.match(dialog, /useId/);
  assert.match(dialog, /admin-dialog-title-\$\{instanceId\}/);
  const projects = read("../pages/admin/projects.vue");
  assert.match(projects, /value: "CLIENT", label: "Клиентский проект"/);
  assert.doesNotMatch(projects, /window\.confirm/);
  assert.match(projects, /function setOwnershipType[\s\S]*clearErrors\(\); saveError\.value = ""/);
  assert.match(projects, /@media\(max-width:768px\)\{\.admin-layout\{flex-direction:column\}/);
  assert.match(projects, /role="radiogroup"/);
  assert.match(projects, /ArrowRight.*ArrowDown/);
  assert.match(projects, /ArrowLeft.*ArrowUp/);
  assert.match(projects, /:tabindex="form\.ownershipType === option\.value \? 0 : -1"/);
});
