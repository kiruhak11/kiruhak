---
name: K-Studio
description: Personal product-development portfolio grounded in real work, clear contribution, and direct contact.
colors:
  sage-paper: "#f4f6f2"
  white-surface: "#ffffff"
  forest-accent: "#41674b"
  forest-accent-hover: "#33543c"
  ink-primary: "#1b241e"
  ink-secondary: "#47544a"
  ink-muted: "#637067"
  dark-ground: "#0b100e"
  dark-surface: "#121a15"
  dark-ink-primary: "#f0f4ef"
  dark-ink-secondary: "#c0ccc2"
  dark-ink-muted: "#9aa89c"
  sage-accent: "#b9d9a7"
  sage-accent-hover: "#c9e6b9"
  border-light: "rgba(31, 48, 37, 0.14)"
  border-dark: "rgba(221, 235, 223, 0.13)"
typography:
  display:
    fontFamily: "Ubuntu, sans-serif"
    fontSize: "clamp(2.65rem, 5.2vw, 5rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.06em"
  headline:
    fontFamily: "Ubuntu, sans-serif"
    fontSize: "clamp(2.4rem, 4.2vw, 3.7rem)"
    fontWeight: 650
    lineHeight: 1.08
    letterSpacing: "-0.05em"
  body:
    fontFamily: "Ubuntu, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  navigation:
    fontFamily: "Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 550
  label:
    fontFamily: "SFMono-Regular, Consolas, Liberation Mono, monospace"
    fontSize: "0.75rem"
rounded:
  sm: "0.5rem"
  md: "0.875rem"
  lg: "1.25rem"
  pill: "999px"
spacing:
  1: "0.25rem"
  2: "0.5rem"
  3: "0.75rem"
  4: "1rem"
  6: "1.5rem"
  8: "2rem"
  12: "3rem"
  16: "4rem"
  24: "6rem"
components:
  navigation:
    backgroundColor: "{colors.white-surface}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.navigation}"
    rounded: "{rounded.lg}"
    height: "68px"
    padding: "10px 18px"
  button-contact:
    backgroundColor: "{colors.forest-accent}"
    textColor: "{colors.white-surface}"
    typography: "{typography.navigation}"
    rounded: "{rounded.sm}"
    height: "44px"
    padding: "0 0.95rem"
  button-details:
    backgroundColor: "{colors.white-surface}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    height: "44px"
    padding: "0 0.8rem"
  input:
    backgroundColor: "{colors.sage-paper}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    height: "44px"
    padding: "0.7rem 0.8rem"
  project-card:
    backgroundColor: "{colors.white-surface}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.lg}"
    padding: "1.35rem"
  technology-chip:
    textColor: "{colors.ink-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.28rem 0.55rem"
---

# Design System: K-Studio

## Overview

**Creative North Star: "Independent Product Studio"**

K-Studio should feel like the considered portfolio of an independent product developer: calm, precise, modern, and confident without implying a larger agency or team. The visual system keeps attention on real products and the person who designed and implemented them. Engineering Casebook is a content principle for cases—explain the product, the developer’s specific contribution, architecture, and technical decisions—not a visual costume.

The existing interface uses a quiet sage-and-green palette, generous spacing, a compact floating header, rounded white surfaces, and restrained transitions. Keep the light and dark themes, direct contact routes, and clear separation between product context and personal work. The code currently contains a typography mismatch (documented below); it is an implementation inconsistency, not an intentional pairing.

**Key Characteristics:**
- Independent and personal, never presented as a large agency.
- Premium through clarity, material restraint, and consistent type—not ornament or noise.
- Product evidence and concrete engineering contribution lead case presentation.
- Calm, accurate copy; no invented metrics, inflated promises, or unsupported claims.

## Colors

A restrained green accent sits against pale sage and white surfaces in light mode, then becomes a soft sage highlight against near-black green surfaces in dark mode.

### Primary
- **Muted Forest Green** (#41674b): Light-theme actions, active states, and emphasis.
- **Soft Sage Accent** (#b9d9a7): Dark-theme action and emphasis.
- **Forest Hover** (#33543c) and **Sage Hover** (#c9e6b9): Theme-specific hover values.

### Neutral
- **Sage Paper** (#f4f6f2): Light page background.
- **White Surface** (#ffffff): Elevated page, card, and modal surfaces.
- **Deep Green Ink** (#1b241e), **Moss Secondary** (#47544a), and **Quiet Sage** (#637067): Light-theme text hierarchy.
- **Night Green** (#0b100e) and **Deep Surface** (#121a15): Dark-theme background and card surface.
- **Pale Text** (#f0f4ef), **Soft Secondary** (#c0ccc2), and **Muted Sage Text** (#9aa89c): Dark-theme text hierarchy.
- Borders use low-opacity green/neutral strokes; exact values are in the frontmatter.

**The Two-Theme Accent Rule.** Preserve the theme-aware pairing: forest green in light mode and soft sage in dark mode. Do not substitute a new high-saturation accent.

## Typography

**Display Font:** Ubuntu (current rendered content; sans-serif fallback)

**Body Font:** Ubuntu (current global rule; sans-serif fallback)

**Navigation Font Token:** Inter, “SF Pro Display”, system sans-serif

**Label/Mono Font:** SFMono-Regular, Consolas, “Liberation Mono”, monospace

**Character:** Current text is compact and contemporary, with tight display tracking and monospaced metadata. The declared Inter navigation token and global Ubuntu rule conflict; the intended final public type pairing is unresolved and should be unified in a later, reviewed refinement.

### Hierarchy
- **Display** (700, clamp(2.65rem, 5.2vw, 5rem) token): Large hero display; individual pages may override it.
- **Headline** (650, clamp(2.4rem, 4.2vw, 3.7rem) token): Page and section headings; route rules may override size and tracking.
- **Title** (650, 1.125rem token): Card and modal titles; project components currently define their own sizes.
- **Body** (400, 1rem token): Main summaries and explanatory text, commonly 1.5–1.65 line height in page components.
- **Label** (500–700, 0.75rem token): Small section labels and monospace technical metadata; actual sizes vary by component.

### Current implementation discrepancy
`assets/styles/collection/_portfolio.scss` declares `--portfolio-font-sans` as Inter with system fallbacks. The public header explicitly applies that token in `components/TheHeader.vue`. Meanwhile, `assets/styles/global/_base.scss` and generated `assets/styles/index.css` apply `font-family: "Ubuntu"` to every element. Project, contact, and case content therefore resolve through Ubuntu on many elements while the header uses Inter. This is confirmed code-level drift and was also noticed visually. The mixed pair is not an intentional design requirement; resolve it only in a separately reviewed typography task.

## Layout

The portfolio content token is 1280px with a responsive horizontal gutter of `clamp(1rem, 4vw, 4rem)`. Sections use a fluid vertical rhythm (`clamp(3rem, 6vw, 5rem)`) and a spacing scale from 0.25rem to 6rem. Project cards use a two-column grid on wider screens and a single column at 760px and below; category tabs become a three-column compact grid at 520px and below. The project modal stacks its overview and sidebar at 700px and below. Contact layout stacks at 760px and tightens copy at 420px. The header switches to mobile navigation at 900px.

These are observed responsive behaviors, not a mandate to add breakpoints everywhere. Preserve focus hierarchy and avoid horizontal overflow at narrow widths.

## Elevation & Depth

Depth is hybrid but restrained: surface tint, thin borders, and soft ambient shadows separate cards and navigation from the page; elevated states increase shadow and border contrast. The sticky header also uses a 14px backdrop blur. Shadows are atmospheric rather than decorative, subordinate to product imagery and content.

### Shadow Vocabulary
- **Soft surface** (`0 8px 24px rgba(11, 20, 14, 0.08)`): Resting project/contact cards and header in light theme.
- **Raised surface** (`0 18px 50px rgba(11, 20, 14, 0.12)`): Hover/focus card and scrolled header in light theme.
- **Soft dark surface** (`0 10px 30px rgba(0, 0, 0, 0.2)`): Resting cards/header in dark theme.
- **Raised dark surface** (`0 22px 60px rgba(0, 0, 0, 0.28)`): Elevated dark-theme states.

## Shapes

The shape language favors soft rectangles over circles: 8px small controls, 14px secondary surfaces, 20px large cards and modals, with pill shapes reserved for technology chips and counts. Borders are fine and low contrast. Defined focus indicators use a visible 2px accent outline with a 3px offset. Avoid ornamental geometry.

## Components

### Buttons
Compact and calm, with a clear action hierarchy.
- **Primary contact:** Theme-aware accent fill and contrast text, small radius (8px), 44px control height.
- **Details / secondary:** Surface-colored with a fine border, 44px height, restrained hover surface/accent treatment.
- **Focus:** Visible 2px accent outline with 3px offset on portfolio controls where defined.
- Use transitions for color, border, shadow, or small transforms; preserve reduced-motion behavior.

### Chips
Technology and count chips use a thin border, quiet secondary text, monospace type, and full pill radius. They are informational, not primary actions.

### Cards / Containers
Project/contact cards use an elevated theme surface, 20px radius, fine border, and soft shadow. Project media sits above the text in a 2:1 frame; current images use `object-fit: contain`. Card content is about 1.35rem on desktop and 1.05rem on narrow screens. Contact channels use 14px or 20px corners depending on hierarchy.

### Inputs / Fields
The homepage project form uses a page-background fill, border, 8px radius, and 44px minimum height; the textarea is taller and vertically resizable. Focus shifts the border to the accent and adds a 2px outline with a 2px offset. Inputs inherit type and text colors.

### Navigation
The public header is a compact sticky surface with fine border, large radius, soft shadow, and translucent elevated background with backdrop blur. Desktop links are 44px high; hover/active states use the surface-hover tone. Mobile navigation replaces desktop links at 900px. Header typography explicitly uses the Inter token; see the discrepancy above.

### Signature: Project Case Modal
The project dialog uses a sticky top bar, ownership/category labels, a two-column overview and product preview. The body separates responsibilities/technical decisions from the technology/link sidebar; it becomes one column on mobile. It is scroll-contained, closes with Escape, traps/restores focus, and locks page scrolling. Reduced motion removes its entrance animation.

## Do's and Don'ts

### Do:
- **Do** keep the studio independent and personal; describe Kirill’s actual role accurately.
- **Do** lead cases with the product itself, then distinguish personal contribution, architecture, and technical decisions.
- **Do** keep the green accent quiet and theme-aware.
- **Do** use real product screens and substantiated outcomes when available and publishable.
- **Do** keep motion subtle, purposeful, and optional under reduced-motion settings.
- **Do** preserve generous spacing, compact navigation, and clean card hierarchy.

### Don't:
- **Don't** imply a large agency or team that does not exist.
- **Don't** add fabricated metrics, loud promises, unsupported outcomes, or decorative noise.
- **Don't** treat the current Ubuntu/Inter conflict as intentional or extend it to new public surfaces.
- **Don't** use project categories or role labels to suggest authorship beyond the confirmed contribution.
