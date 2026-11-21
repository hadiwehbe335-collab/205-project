---
name: "Tutorly"
description: "A calm, course-grounded learning workspace organized as connected study chapters."
colors:
  primary-indigo: "#5b55d9"
  primary-indigo-dark: "#423db6"
  primary-indigo-pale: "#e9e9ff"
  provenance-mint: "#267664"
  provenance-mint-pale: "#e7f5f0"
  priority-amber: "#8a5c11"
  priority-amber-pale: "#fff2d8"
  feedback-rose: "#9a3f4d"
  feedback-rose-pale: "#fff0f2"
  deep-ink: "#172039"
  soft-ink: "#515c75"
  muted-ink: "#68718a"
  sidebar-soft: "#222d48"
  cool-canvas: "#f7f8ff"
  white-surface: "#ffffff"
  soft-lilac: "#f0f1ff"
  field-lilac: "#fafaff"
  blue-grey-line: "#dfe3f3"
  blue-grey-line-strong: "#cbd1e5"
typography:
  display:
    fontFamily: "Manrope, ui-sans-serif, sans-serif"
    fontSize: "clamp(3.2rem, 5.5vw, 5.6rem)"
    fontWeight: 800
    lineHeight: 0.99
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Manrope, ui-sans-serif, sans-serif"
    fontSize: "clamp(2rem, 3.5vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Manrope, ui-sans-serif, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Manrope, ui-sans-serif, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Manrope, ui-sans-serif, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 800
    lineHeight: 1.4
  control:
    fontFamily: "Manrope, ui-sans-serif, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 800
    lineHeight: 1
  code:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "0.7rem"
    fontWeight: 400
rounded:
  sm: "8px"
  md: "10px"
  input: "11px"
  control: "12px"
  panel: "16px"
  pill: "99px"
  circle: "50%"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  7: "28px"
components:
  button-primary:
    backgroundColor: "{colors.primary-indigo}"
    textColor: "{colors.white-surface}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 19px"
    height: "46px"
  button-primary-hover:
    backgroundColor: "{colors.primary-indigo-dark}"
    textColor: "{colors.white-surface}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 19px"
    height: "46px"
  button-secondary:
    backgroundColor: "{colors.white-surface}"
    textColor: "{colors.primary-indigo-dark}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0 19px"
    height: "46px"
  input-field:
    backgroundColor: "{colors.field-lilac}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.input}"
    padding: "0 14px"
    height: "48px"
  app-sidebar:
    backgroundColor: "{colors.deep-ink}"
    textColor: "{colors.white-surface}"
    width: "244px"
    padding: "24px 17px 18px"
  next-action-panel:
    backgroundColor: "{colors.deep-ink}"
    textColor: "{colors.white-surface}"
    rounded: "{rounded.panel}"
    padding: "28px"
  study-card:
    backgroundColor: "{colors.white-surface}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.panel}"
    padding: "0"
  source-strip:
    backgroundColor: "{colors.provenance-mint-pale}"
    textColor: "{colors.provenance-mint}"
    rounded: "{rounded.control}"
    padding: "18px 26px"
  preference-control-selected:
    backgroundColor: "{colors.primary-indigo-pale}"
    textColor: "{colors.primary-indigo-dark}"
    rounded: "{rounded.md}"
    height: "41px"
---

# Design System: Tutorly

## Overview

**Creative North Star: "Connected Study Chapters"**

Tutorly feels like a calm sequence of connected study chapters inside one dependable university workspace. A compact ink sidebar keeps the course and destination visible, while the cool canvas gives each task enough room to breathe. Every view establishes one clear heading, one dominant next action, and only the supporting context needed to continue.

The dashboard answers “what should I study now?” rather than displaying a generic analytics grid. Course materials, revision priorities, Tutorly AI, progress, and learning preferences are supporting chapters around a deliberately low-density five-stage session: Understand, Example, Check, Practice, and Complete. Visible source provenance remains part of the answer itself; when the uploaded material is insufficient, Tutorly says so instead of fabricating course-specific guidance.

**Key Characteristics:**

- Calm app shell with a compact dark sidebar and generous cool-white workspace.
- Recommendation-led dashboard with one dominant study action.
- Narrow, low-density study stages sequenced one task at a time.
- Deep-ink Manrope hierarchy with restrained indigo orientation and action.
- Mint source surfaces that keep course evidence adjacent to claims.
- Honest tutor states for both grounded answers and missing evidence.

## Colors

The palette is cool, quiet, and trust-building: indigo carries action and orientation, mint carries provenance and verified readiness, and amber or rose appear only for explicit priority and feedback states.

### Primary

- **Chapter Indigo:** The confident action color for primary buttons, active navigation icons, active study stages, progress, and selected orientation states.
- **Deep Chapter Indigo:** The hover and high-emphasis text state for indigo controls.
- **Soft Lilac Signal:** The low-chroma field for selected preferences, quiet buttons, icon wells, and active-stage halos.

### Secondary

- **Source Mint:** Reserved for course-ready, grounded, complete, or correct meaning.
- **Source Mint Wash:** The evidence surface behind citations, course readiness, grounded tutor answers, and validated feedback.
- **Priority Amber:** Used sparingly for revision-priority chips, cautionary explanation notes, and missing-source attention states.
- **Feedback Rose:** Reserved for incorrect-answer feedback after a student commits a choice.

### Neutral

- **Deep Study Ink:** The sidebar, dominant recommendation panels, headings, and high-emphasis content.
- **Soft Study Ink:** Explanatory text that needs more presence than metadata.
- **Muted Study Ink:** Descriptions, secondary labels, metadata, and helper copy.
- **Sidebar Soft:** The subtle active-navigation field inside the dark shell.
- **Cool White Canvas:** The page-level ground behind every application chapter.
- **White Surface:** Study cards, course panels, tutor answers, controls, and modal surfaces.
- **Soft Lilac Field:** Quiet grouping, worked-example blocks, recommendation context, and preference feedback.
- **Blue-Grey Lines:** Fine borders, dividers, progress tracks, and input structure.

### Named Rules

**The Two-Meaning Accent Rule.** Indigo means action or orientation; mint means provenance, readiness, completion, or validated feedback. Do not swap those roles for decoration.

**The Quiet Canvas Rule.** Most of every screen remains cool white, white, deep ink, or pale lilac so the few saturated states retain meaning.

**The Exception Color Rule.** Amber and rose appear only when priority, caution, or an answered state requires them; they never become ambient decoration.

## Typography

**Display Font:** Manrope (with `ui-sans-serif, sans-serif` fallback)

**Body Font:** Manrope (with `ui-sans-serif, sans-serif` fallback)

**Label/Mono Font:** Manrope for labels; system monospace only for database relations and schema notation.

**Character:** Manrope gives Tutorly a modern, open, credible voice. Heavy, tightly tracked headings make each chapter decisive; compact metadata and relaxed explanatory line height keep academic material easy to scan without making it feel juvenile or institutional.

### Hierarchy

- **Display** (800, fluid 3.2–5.6rem, 0.99 line-height): The intro promise only; it may wrap boldly and use indigo for the final phrase.
- **Headline** (800, fluid 2–3rem, 1.08 line-height): Page titles and the study-session topic heading.
- **Title** (800, 1.25rem, 1.25 line-height): Stage titles, recommendation topics, and primary panel headings.
- **Body** (400, 0.9rem, 1.65 line-height): Explanations and descriptive copy; teaching content stays close to a 52–72 character measure.
- **Label** (800, 0.72rem): Stage counts, statuses, priorities, sources, and compact metadata. Uppercase is used only where the content is genuinely metadata or schema.
- **Control** (800, 0.9rem): Primary and secondary actions.
- **Code** (400, 0.7rem): Database relations, determinants, and schema notation only.

### Named Rules

**The Chapter Heading Rule.** Every view gets one clear heading; supporting type steps down sharply instead of competing with it.

**The Teaching Measure Rule.** Long explanations stay narrower than the application shell and are broken into ordered steps, examples, or checks before another paragraph is added.

## Layout

The application is organized around a fixed 244px deep-ink sidebar and a 76px white top bar. The sidebar holds Dashboard, My Course, Study, Tutor, Progress, and Settings, with the active destination placed on a quiet ink field. Course readiness and the student’s learning-preference entry remain persistent but visually secondary. Standard chapters use a centered content width capped at 1180px with 28px side gutters; the study session narrows to 980px so teaching material reads as a focused lesson rather than a dashboard.

The dashboard uses a 1.18/0.82 split: the dark “Continue Studying” panel is dominant, “Recommended Next” is secondary, and recent course material forms a quiet full-width row. Course materials use a two-column upload/list workspace. Progress and settings favor broad horizontal panels rather than collections of cards. The study session is sequential: its heading and stage count lead into a five-stage stepper, followed by one white stage card and, where evidence exists, a mint source strip attached to that card.

At 1100px, dashboard and course grids collapse to one column. At 900px, the fixed sidebar becomes a slide-in drawer, the content gutters become 24px, and completed/future step labels collapse while the active stage name remains visible beside its numbered circle. At 620px, gutters become 16px, page actions and stage controls stack, teaching blocks become single-column, and source references wrap vertically without losing filenames or locations. Mobile preserves content order, stage count, active/completed states, source visibility, and the same primary next action.

**The One-Task Stage Rule.** A study stage contains one learning job and one forward decision; optional detail, hints, and alternate explanations reveal within that stage instead of spawning a competing layout.

## Elevation & Depth

Tutorly uses tonal layering, fine borders, and modest ambient shadows. The fixed ink sidebar establishes the shell through contrast; white panels sit on the cool canvas with one-pixel blue-grey boundaries. The strongest ambient lift belongs to the intro action, the dark dashboard recommendation, study cards, tutor answers, and transient modals. Depth should feel like paper lifted a few millimetres, never floating glass.

### Shadow Vocabulary

- **Ambient panel** (`0 18px 45px rgba(40,45,95,.09), 0 3px 10px rgba(40,45,95,.05)`): Intro preview and primary lifted panels.
- **Dark recommendation** (`0 18px 45px rgba(23,32,57,.16)`): The dashboard’s dominant next-action panel.
- **Primary action** (`0 9px 22px rgba(91,85,217,.24)`): Primary buttons at rest; expands modestly on hover.
- **Grounded completion** (`0 12px 25px rgba(38,118,100,.2)`): Completion marks and positive confirmation accents.
- **Modal** (`0 24px 60px rgba(17,24,42,.24)`): Dialogs over the dimmed shell.

### Named Rules

**The Ambient-Only Rule.** Shadows are diffuse and low-contrast; borders, canvas contrast, and tonal fields do most structural work.

## Shapes

The form language is gently rounded and consistent. Major working panels, study cards, tutor shells, and dialogs use 16px corners; navigation rows, source strips, inputs, and nested blocks stay between 10px and 13px; priority and status labels use a full 99px capsule. Circular forms are reserved for stage markers, progress points, and tiny readiness indicators. The Tutorly mark, course monogram, and completion mark use compact rounded squares rather than decorative illustrations.

**The Large-Panel Rule.** Use 16px radii for primary working surfaces and 10–13px for nested controls; smaller radii belong inside larger ones, never the other way around.

## Components

Components feel calm and purposeful: a small number of strong patterns repeat across every chapter, while academic content determines the internal layout.

### Buttons

- **Shape:** Gently rounded controls (12px) with a 46px minimum height; the intro action grows to 54px.
- **Primary:** Chapter Indigo with white extra-bold Manrope text and a modest indigo shadow.
- **Hover / Focus:** Lift 2px and deepen the indigo on hover; use a 3px translucent indigo focus outline with a 3px offset. Disabled actions retain their label and reduce opacity.
- **Secondary / Quiet / Selected:** Secondary buttons use white with a strong blue-grey border; quiet buttons use soft lilac; selected controls use a stronger indigo-grey border and pale indigo fill.

### Chips

- **Style:** Compact capsules for High Priority and Medium Priority, plus small rounded status labels for file processing and readiness.
- **State:** Amber communicates high priority, pale indigo communicates medium priority, and mint communicates ready or grounded. Chips summarize state and do not replace explanatory copy.

### Cards / Containers

- **Corner Style:** Major panels and study cards use 16px corners, with 10–14px nested blocks.
- **Background:** White for working content, deep ink for the dominant next action and completion recommendation, lilac for quiet teaching context, and mint wash for provenance.
- **Shadow Strategy:** Flat and bordered by default; ambient lift appears on dominant, focused, or transient surfaces.
- **Internal Padding:** Usually 18–28px; teaching cards may separate their header, lesson body, controls, and provenance into attached regions.

### Inputs / Fields

- **Style:** Lilac-white fill, strong blue-grey 1px border, 11px radius, 48px height, and 14px horizontal padding.
- **Focus:** A 3px translucent indigo outline with 3px offset; caret remains indigo.
- **Error / Disabled:** Incorrect answers use rose only after selection. Disabled controls reduce opacity while remaining legible.

### Navigation

- **App shell:** A fixed 244px dark sidebar on desktop with six labeled destinations, a persistent course summary, and a learning-preference entry. The active row uses Sidebar Soft with a lilac icon.
- **Top bar:** A quiet 76px white bar names the workspace chapter and keeps course-ready status plus the avatar visible.
- **Mobile:** At 900px the sidebar becomes a drawer opened from the top bar; the background scrim closes it and the content column returns to full width.

### Dashboard Next Action

The deep-ink Continue Studying panel is the dashboard’s visual anchor. It combines a single recommended topic, topic progress, one primary continuation action, and a short source line. Recommendation rows and recent material remain quieter, so the first question the dashboard answers is always what to study now.

### Five-Stage Study Session

The stepper names Understand, Example, Check, Practice, and Complete. Completed stages turn mint, the active stage turns indigo with a pale halo, and future stages remain outlined. Each stage renders one white card: an ordered explanation, a worked dependency example, a gated knowledge check, a practice prompt with optional hint/answer, or a completion summary with the next recommendation. On mobile, completed and future labels collapse, while all five markers, the active stage name, and the explicit “Stage n of 5” label remain.

### Source Provenance

Mint source regions are attached directly to explanations and tutor answers. Each source reference names the file and exact location, opens a mock preview, and sits beside a “Grounded in your course” confirmation plus a report action. Practice uses a compact “Based on” strip and explicitly states that generated practice is not a predicted assessment question.

### Tutor Evidence States

Grounded tutor answers use a white response card with source references and a mint confirmation footer. If uploaded material is insufficient, a centered missing-evidence panel states that Tutorly will not invent a course-specific answer and offers “Search another topic” or “Upload more material.” The conversation may look like chat, but evidence status—not conversational decoration—is the signature pattern.

### Learning Preferences

Preference groups are full-width segmented controls inside one bordered panel. The selected option uses a pale indigo fill, stronger indigo border, and checkmark. Preferences are framed as choices available to every student, and the summary states that they immediately affect the Understand stage.

### Motion

State transitions use `cubic-bezier(.22,1,.36,1)` over about 200–240ms. Stage content may enter with an 11px upward resolve and 4px blur; progress widths use a 450ms transition; loading dots loop at 1s; toasts enter over 400ms. Reduced-motion preference collapses animations and transitions to effectively instant feedback.

## Do's and Don'ts

### Do:

- **Do** use the compact dark app shell to keep destinations, course context, and learning preferences consistently oriented.
- **Do** make the dashboard answer what to study now with one dominant continuation action and quieter supporting panels.
- **Do** preserve the Understand, Example, Check, Practice, and Complete sequence as the study-session backbone.
- **Do** keep study stages deliberately low-density and reveal optional detail, hints, or alternate explanations only on request.
- **Do** place visible file-and-location provenance beside or directly beneath grounded study support and tutor answers.
- **Do** show an explicit missing-evidence state when course material cannot support an answer.
- **Do** use mint only for grounded, ready, correct, or complete meaning, and preserve focus rings, responsive stacking, semantic controls, and reduced-motion support.
- **Do** describe preferences as user choices available to every student, without asking for or inferring a diagnosis.

### Don't:

- **Don't** reintroduce the former four-screen Home, Upload, Choose, and Result rail or a feature-gallery flow inside the final app shell.
- **Don't** turn the dashboard into a generic AI control center, analytics wall, or grid of equal-weight cards.
- **Don't** present Tutorly AI as an ungrounded general chatbot or hide sources behind a separate detail view.
- **Don't** place multiple learning jobs, competing calls to action, or dense reference material into one study stage.
- **Don't** use indigo and mint as interchangeable decoration or let amber and rose become ambient palette colors.
- **Don't** introduce childish styling, medical framing, grade guarantees, assessment predictions, heavy shadows, or glass effects.
