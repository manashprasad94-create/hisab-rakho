---
name: Hisab Kitab — Ink & Marigold
description: A friendly ledger with dependable ink and restrained marigold identity.
colors:
  primary: "#203047"
  primaryHover: "#162438"
  accent: "#F2BE49"
  accentSoft: "#FFF5D8"
  canvas: "#F4F5F2"
  surface: "#FFFFFF"
  surfaceMuted: "#ECEFEA"
  text: "#202A35"
  textMuted: "#5D6872"
  border: "#D8DED8"
  controlBorder: "#84919A"
  success: "#176548"
  successSoft: "#EAF4EE"
  error: "#AD3545"
  errorSoft: "#FCEEF0"
  pending: "#865B13"
  pendingSoft: "#FFF5D8"
typography:
  headline:
    fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 650
  body:
    fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.012em"
  label:
    fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 600
  metadata:
    fontFamily: "Manrope, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 650
    lineHeight: 1.5
rounded:
  compact: "8px"
  control: "12px"
  card: "16px"
spacing:
  unit: "4px"
  small: "8px"
  compact: "12px"
  medium: "16px"
  gutter: "20px"
  large: "24px"
  section: "32px"
  spacious: "48px"
components:
  primaryButton:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  secondaryButton:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  dangerButton:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.error}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  ghostButton:
    textColor: "{colors.textMuted}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
    padding: "24px"
  selectedNavigation:
    backgroundColor: "{colors.accentSoft}"
    textColor: "{colors.primary}"
    rounded: "{rounded.control}"
  successBadge:
    backgroundColor: "{colors.successSoft}"
    textColor: "{colors.success}"
    rounded: "{rounded.compact}"
    padding: "4px 8px"
---

# Design System: Hisab Kitab — Ink & Marigold

## Overview

**Creative North Star: "Ink & Marigold"**

Ink establishes trust and legibility; restrained marigold adds familiar warmth and memorable identity. People, amounts, and next actions read like a clear, friendly ledger. Shared white surfaces, muted supporting tools, and quiet dividers give the interface a dependable everyday character.

**Key Characteristics:**
- Clear financial direction and tabular amounts.
- Restrained marigold identity within a neutral ledger.
- Comfortable controls and compact, readable record rows.

Runtime tokens live in `src/index.css`; reusable components live in `src/components`.

## Colors

The palette pairs dependable blue ink with warm marigold and soft neutral paper.

### Primary

Ink defines primary actions, headings, focus, and neutral emphasis; deeper ink supplies primary hover feedback. Marigold belongs to the rupee brand mark and small selected indicators. Its pale tint marks selected navigation and choices. Use ink text on marigold. Primary buttons stay ink.

### Neutral

White surfaces sit on the soft canvas. Muted surfaces group supporting tools and the desktop sidebar. Text and muted text distinguish main content from supporting copy. Fine borders separate cards and ledger rows; stronger control borders distinguish fields. Decorative avatar colors stay muted.

### Semantic states

Green means receive, success, or settled. Red means pay, error, or destructive intent. Pending uses dark amber on pale amber. Each has a corresponding soft supporting surface.

**The Labeled Direction Rule.** Always pair financial colors with explicit labels, signs, icons, or status text.

## Typography

Self-hosted Manrope with system sans fallbacks unifies product and public screens. The variable font supports the weight range used throughout the interface.

Body and inputs use the body role; supporting copy and form labels use label size. Metadata and badges remain at least 12px. Product headings use the headline role on mobile and grow to 32px at the sidebar breakpoint. Authentication headings use weight 750. Record titles use the title role; buttons use 16px at weight 700. Balance amounts use 30px on mobile, 36px on desktop, and 25px at the narrowest breakpoint, with weight 700 and line-height 1.15.

**The Ledger Numerals Rule.** Monetary amounts and form controls use tabular numerals. Long names, emails, and amounts wrap. Public-page headlines can be larger within the same family and palette.

## Layout

The interface follows the spacing scale above. Mobile pages have 20px gutters, reduced to 16px at widths up to 380px, with safe-area-aware bottom navigation. At 900px, navigation becomes a persistent 240px sidebar; the working area is centered up to 920px wide with 36px horizontal padding. Form pages stay narrower at 700px. Authentication content is capped at 440px.

Cards commonly use 24px padding; compact mobile records use 16–20px. Dashboard balances remain in two columns; supporting tools become two columns at 540px. Lists use grouped rows and dividers. Transaction modes use two columns on mobile with the last choice spanning the row, and three columns at 640px. Friend selection uses a compact searchable disclosure dropdown. Single selection closes the dropdown; Split and Same Amount Each support checkboxes with a selected count and Done action. The options scroll within a 240px region, keeping long friend lists from extending the form.

## Elevation & Depth

Cards are flat white surfaces with fine borders. Depth comes mainly from tonal separation, spacing, and typography. Low-opacity ink shadows provide interaction feedback and overlay separation.

- Small shadow (`0 2px 5px rgb(32 48 71 / 4%)`): interactive card hover.
- Medium shadow (`0 8px 24px rgb(32 48 71 / 8%)`): elevated supporting surfaces where used.
- Primary hover shadow (`0 3px 8px rgb(32 48 71 / 16%)`): primary button feedback.

**The Flat Ledger Rule.** Records inside grouped lists use dividers and surface tint for hover, without individual shadows.

## Shapes

Controls and avatars use gently curved control corners; cards and ledger groups use larger card corners. Badges and icon buttons use compact corners. Established circular icon affordances can remain circular. Text buttons and inputs have a minimum height of 48px; icon buttons retain 44px targets. Keep the shared shape vocabulary across routes.

## Components

### Buttons

Confident ink primary, bordered white secondary, neutral ghost, and red danger actions share control corners, 12px 20px padding, and 48px minimum height. Hover darkens ink or tints neutral surfaces. Pressed buttons gain a subtle inset shadow. Disabled states retain muted text at full opacity; busy states preserve labels and dimensions.

### Cards and ledger rows

Shared cards use white surfaces, card corners, and fine borders. Standalone interactive cards tint and gain the small shadow on hover. Grouped record lists remove individual borders and shadows, retain separators, and align titles, metadata, and amounts. Navigable cards support keyboard activation and visible focus.

### Inputs and fields

Shared Input, Select, and Textarea use associated labels, 16px text, neutral control borders, and 48px minimum height. Textareas start at 112px and resize vertically. Focus uses an ink border and a 2px ink outline offset by 2px; invalid focus becomes red. Disabled fields use muted surfaces and readable muted text.

### Navigation

The mobile bar is white with 12px labels and pale marigold selected backgrounds. At 900px, navigation becomes a muted sidebar with 14px labels. Active navigation adds a small marigold underline on mobile and dot on desktop. Notification counts use ink.

### Badges and balances

Badges use compact corners, 4px 8px padding, and explicit neutral, success, error, or pending text. Balances use prominent tabular amounts and receive/pay labels; semantic panels use soft green/red surfaces. Fund roles remain neutral.

### Feedback and interaction

StatusMessage uses labeled semantic errors/success and neutral information. EmptyState and LoadingState provide explanatory text and accessible loading labels. Transitions last 160–180ms for color, border, and shadow feedback. Visible ink focus remains consistent. Reduced motion disables transitions, smooth scrolling, and decorative animation.

## Do's and Don'ts

### Do:
- Do prioritize people, financial direction, amounts and required actions.
- Do reuse tokens/components across product and public screens.
- Do keep marigold restrained and status explicitly labeled.
- Do preserve contrast, comfortable targets and mobile wrapping.

### Don't:
- Don't use green/red as decorative branding or neutral notification colors.
- Don't hide focus, fade disabled text or depend on color alone.
- Don't introduce arbitrary typography, radii, gradients or per-page systems.
