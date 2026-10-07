import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parseProjectInput } from "../server/utils/project-input";
import { requireAdmin } from "../server/utils/require-admin";

const base = { title: "Case", shortDescription: "Summary", description: "Summary", image: "/images/case.webp", category: "web" };

test("admin project API requires an authenticated administrator", () => {
  assert.throws(() => requireAdmin(null), (error: { statusCode?: number }) => error.statusCode === 401);
  assert.throws(() => requireAdmin({ isAdmin: false }), (error: { statusCode?: number }) => error.statusCode === 403);
  assert.equal(requireAdmin({ isAdmin: true }).isAdmin, true);
});

test("OWN and PARTICIPATION project inputs enforce their required case study fields", () => {
  const own = parseProjectInput({ ...base, ownershipType: "OWN", projectSummary: "About the product", role: "Developer", responsibilities: ["Built the app"], technologies: ["Nuxt"] });
  assert.equal(own.ownershipType, "OWN");
  const participation = parseProjectInput({ ...base, ownershipType: "PARTICIPATION", projectSummary: "About the product", role: "Frontend", responsibilities: ["Built a part"], company: "Team" });
  assert.equal(participation.ownershipType, "PARTICIPATION");
  assert.throws(() => parseProjectInput({ ...base, ownershipType: "OWN", projectSummary: "About", role: "Developer", responsibilities: ["Built it"] }), (error: { statusCode?: number }) => error.statusCode === 400);
  assert.throws(() => parseProjectInput({ ...base, ownershipType: "PARTICIPATION", projectSummary: "About", responsibilities: ["Built it"] }), (error: { statusCode?: number }) => error.statusCode === 400);
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

test("partial ownership downgrade preserves stored claims while hiding public output", () => {
  const update = parseProjectInput({ ownershipType: "UNVERIFIED" }, true);
  assert.deepEqual(update, { ownershipType: "UNVERIFIED", featured: false });
  assert.deepEqual(parseProjectInput({ featured: false }, true), { featured: false });
});

test("admin editors use one accessible dialog primitive with dirty-form safeguards", () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
  const dialog = read("../components/AdminDialog.vue");
  for (const path of ["../pages/admin/projects.vue", "../pages/admin/materials.vue", "../pages/admin/tutorials.vue"]) {
    const page = read(path);
    assert.match(page, /<AdminDialog/);
    assert.match(page, /несохранённые изменения/);
    assert.doesNotMatch(page, /class="modal-overlay"/);
  }
  assert.match(dialog, /role="dialog"/);
  assert.match(dialog, /aria-modal="true"/);
  assert.match(dialog, /event\.key === "Escape"/);
  assert.match(dialog, /event\.key !== "Tab"/);
  assert.match(dialog, /previousFocus\?\.focus\(\)/);
  assert.match(dialog, /document\.body\.style\.overflow = "hidden"/);
  assert.match(dialog, /100dvh/);
});
