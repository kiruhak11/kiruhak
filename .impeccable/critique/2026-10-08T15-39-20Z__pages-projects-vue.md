---
target: /projects
total_score: 24
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 1
target_fingerprint: "sha256:04dfb3670122ef39ee2d7cee2bc4485917d6871ead415c6a3f165efe338c1203"
target_path: /projects
timestamp: 2026-10-08T15-39-20Z
slug: pages-projects-vue
---
# Impeccable Critique — /projects

Method: dual-agent (`/root/visual_critique` and `/root/ux_technical_audit`) plus parent browser review. These are independent assessments synthesized after both finished.

## Overall

The portfolio has a coherent, restrained identity: sage background, green accent, compact floating navigation, rounded cards, and clear contact paths. Project categories distinguish own, client, participation, and unverified work. However, `/projects` reads more like a structured résumé/specification than a showcase of digital products: cards and modals are text-heavy, previews lean toward brand banners/logos rather than real product UI, and confirmed outcomes are sparse. The main system-level visual issue is typography drift: the header uses an Inter/system stack while a global Ubuntu rule changes the type voice across content.

## Nielsen heuristic scores (0–4; N/A excluded)

| Heuristic | Score | Evidence |
|---|---:|---|
| Visibility of system status | 3 | Category counts, selected tab, loading and error states are present. |
| Match between system and real world | 3 | Categories and personal roles are legible; isolated English labels remain in Russian UI. |
| User control and freedom | 4 | Keyboard category navigation; modal Escape close, focus trap/restoration, scroll-lock release. |
| Consistency and standards | 2 | Inter token in header/project wrapper conflicts with global Ubuntu declaration. |
| Error prevention | 3 | Archive clearly separates unverified role/contribution; no risky action in reviewed public flow. |
| Recognition rather than recall | 3 | Labeled categories/counts; “Подробнее” and “Production” labels are weak without nearby context. |
| Aesthetic and minimalist design | 3 | Clean composition, but cases are text-heavy and previews look more like banners than product screens. |
| Help users recover from errors | 3 | Error state and retry control exist; browser did not induce failures. |
| Flexibility and efficiency | N/A | No accelerator expectation for this public portfolio. |
| Help and documentation | N/A | Not applicable to portfolio showcase. |

Total: 24/32 applicable points.

## What works

- OWN / CLIENT / PARTICIPATION categories are separated and counted; empty participation is not misrepresented as populated.
- Case context and personal responsibility are distinguished; the archive explains why role/stack are not published.
- Home page has a clear positioning/CTA; contact page prioritizes Telegram while email and GitHub remain findable.
- Light and dark themes are coherent; sampled text contrast pairs pass WCAG AA.
- Projects page had no horizontal overflow at 320, 390, 768, and 1440 CSS px.
- Project modal keyboard behavior passed: Escape closes, Tab/Shift+Tab stay contained, focus returns to trigger, and page scroll lock is released.

## Priority findings

### [P1] Public typography drifts between Ubuntu and Inter
- Location: `assets/styles/index.css:49`, `components/TheHeader.vue:143`, `pages/projects.vue:209`.
- Impact: the page does not read as one consistently designed system; typography shifts tone between navigation and case content.
- Fix: choose one confirmed public-portfolio typography rule and apply it consistently across headings, body, and navigation; review before implementation.
- Suggested command: `$impeccable typeset`.

### [P2] Secondary mobile action targets are small
- Location: `pages/projects.vue:86–91` and `:248`, plus production/footer text links.
- Impact: archive “Подробнее” was about 70×30 CSS px; several text links are substantially shorter than 44px, making them harder to tap.
- Fix: enlarge hit areas without visually inflating compact text styling.
- Suggested command: `$impeccable adapt`.

### [P2] Case visuals do not show enough of the product
- Location: `components/ProjectCard.vue`, `components/ProjectModal.vue` and case assets.
- Impact: previews are mostly brand/banner-like; repeated role/summary/stack prose and sparse confirmed outcomes make it harder to judge implementation quality quickly.
- Fix: where permitted, lead with real interface screenshots and make specific personal contribution and confirmed result easier to scan; do not invent metrics.
- Suggested command: `$impeccable critique`.

### [P3] Russian count grammar and mixed-language labels
- Location: `pages/projects.vue:12` and project-card/modal metadata.
- Impact: “5 подтверждённых кейса” is grammatically incorrect; “Production”, “CASE STUDY”, “STACK” interrupt an otherwise Russian UI.
- Fix: correct the count inflection and localize labels or explicitly standardize intentional English terms.
- Suggested command: `$impeccable clarify`.

### [P3] Long titles and tiny metadata weaken scanability
- Location: case cards and `ProjectModal` (OKNA title wraps across three lines); small metadata/technology labels.
- Impact: supporting information competes with the project title on small screens and dense cases.
- Fix: tune title/metadata hierarchy while retaining full project names.
- Suggested command: `$impeccable layout`.

## Persona red flags

- **Potential client:** sees polished visual identity and an easy Telegram CTA, but banner-like previews do not always show the actual product; confirmed outcomes are not consistently summarized.
- **Technical lead/employer:** can inspect stack and responsibilities, but must read repeated description/metadata to distinguish project scope from implementation complexity.
- **Mobile visitor with motor limitations:** small archive and footer targets are less forgiving to tap.

## Minor observations

- Screenshot-backed visual review was available; no critical overlay was injected into production.
- The Impeccable detector returned `[]` for `pages/projects.vue`; manual typography and target-size observations are contextual findings not represented by that detector.
- Console/network logs, screen reader, physical touch, and system reduced-motion emulation were not available as verified evidence in this pass.
