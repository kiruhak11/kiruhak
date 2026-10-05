import assert from "node:assert/strict";
import { test } from "node:test";
import { publicContact } from "../constants/public-contact";
import { publicNavigation } from "../constants/public-navigation";
import {
  getProjectExternalLinks,
  isUsableProjectPreview,
} from "../utils/project-links";

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
