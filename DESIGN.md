---
name: Glazing
description: A sleek, high-density minimal productivity matrix for competitive squad execution.
colors:
  primary: "#635bff"
  primary-glow: "rgba(99, 91, 255, 0.2)"
  neutral-bg: "#09090b"
  neutral-surface: "#18181b"
  neutral-border: "#27272a"
  text-primary: "#f8fafc"
  text-muted: "#94a3b8"
  accent-amber: "#f59e0b"
  accent-cyan: "#06b6d4"
  accent-emerald: "#10b981"
  accent-rose: "#f43f5e"
typography:
  display:
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif"
    fontSize: "clamp(2rem, 5vw, 2.75rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.015em"
  body:
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  label:
    fontFamily: "'SF Mono', 'JetBrains Mono', monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.05em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "8px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.full}"
    padding: "8px 20px"
  theme-card:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.xl}"
    padding: "24px"
---

# Design System: Glazing

## Overview

**Creative North Star: "The Precision Cockpit"**

Glazing is engineered for dedicated operatives who measure their days in deep work and verifiable output. Rather than loud, gamified playgrounds with childish badges or distracting neon effects, the visual language is restrained, quiet, and hyper-focused. The interface acts as a high-density, calm telemetry console where every pixel serves situational awareness.

The design philosophy favors dark-by-default surfaces, crisp typographic contrast, and restrained accent moments. Visual hierarchy is established through spatial rhythm and typographic weight rather than heavy colored borders or high-contrast containers.

**Key Characteristics:**
- **Subdued & Tactile**: Low-luminance neutral backgrounds with intentional, sparse status colors.
- **Data-Dense Yet Scannable**: Information is tightly grouped, with numbers and timestamps presented in monospaced precision.
- **Earned Visual Moments**: Micro-animations and accent glows appear strictly as feedback to actions or live state shifts.

---

## Colors

The palette is anchored by deep carbon surfaces with semantic precision accents for the core competency domains.

### Primary
- **Electric Iris** (`#635bff`): The primary interaction token for key actions, focus states, and primary buttons. Used with surgical restraint ($\le 10\%$ of any surface).

### Accent Signals
- **Field Focus Amber** (`#f59e0b`): Reserved for in-progress timers, active deep work, and urgency countdowns.
- **Dedication Cyan** (`#06b6d4`): Assigned to logged time, Pomodoro telemetry, and focus hours.
- **Conditioning Emerald** (`#10b981`): Represents verified proof-of-work, gym completions, and positive score streaks.
- **Bounty Gold** (`#eab308`): Staked points, escrow pools, and high-value challenge targets.
- **Alert Rose** (`#f43f5e`): Errors, failed verification, or critical penalties.

### Neutral
- **Canvas Base** (`#09090b`): Dark-mode base canvas; high-contrast deep black.
- **Card Surface** (`#18181b`): Elevation level 1; cards, inputs, and container panels.
- **Border Subtle** (`#27272a`): Hairline boundary between cards and sections.
- **Text Primary** (`#f8fafc`): Headings, high-contrast values, and metrics.
- **Text Body / Muted** (`#94a3b8`): Secondary descriptions, helper text, and inactive metadata.

### Named Rules
**The Rarity Rule**: Accent colors appear strictly on active state indicators and metrics. No colored 4px border callouts or saturated container backgrounds.

---

## Typography

**Display & Body Font:** `SF Pro Display`, `-apple-system`, `BlinkMacSystemFont`, `Plus Jakarta Sans`, sans-serif  
**Telemetry & Data Font:** `SF Mono`, `JetBrains Mono`, monospace  

**Character:** Clean, technical, highly legible typography with negative letter-spacing for large headlines and tabular alignment for quantitative telemetry.

### Hierarchy
- **Display** (Bold 800, `clamp(2rem, 5vw, 2.75rem)`, line-height 1.1, tracking -0.03em): Primary page titles.
- **Headline** (Bold 700, `1.5rem` / `24px`, line-height 1.25): Card section titles and primary modal headers.
- **Title** (Semibold 600, `1.125rem` / `18px`, line-height 1.35): Task card titles and subheadings.
- **Body** (Regular 400, `0.875rem` / `14px`, line-height 1.5): Task notes, debrief descriptions, and general text.
- **Label / Data** (Semibold 600, `0.75rem` / `12px`, monospace): Counter badges, time durations, point tallies, and timestamps.

### Named Rules
**The No-Eyebrow Rule**: Headings carry their own weight. Do not add redundant kickers or floating pill chips above page headings.

---

## Layout

- **Container Model**: Max width constrained to `1240px` centered with responsive horizontal padding (`p-4` on mobile, `p-8` on desktop).
- **Grid Structure**: 4-column responsive grid for top-level telemetry cards (`grid-cols-2 md:grid-cols-4`).
- **Spacing Scale**: Base unit of `4px` adhering to an 8pt spatial grid (`8px`, `16px`, `24px`, `32px`).
- **Grouping**: Tightly bound related data with generous separation between distinct operational blocks.

---

## Elevation & Depth

Glazing uses subtle tonal layering and hairline 1px borders rather than heavy, floating multi-layered shadows.

### Shadow Vocabulary
- **Resting Surface**: `box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4)` on cards and panels.
- **Interactive Hover**: `box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5)` with `-1px` subtle translation on interactive cards.
- **Modal Depth**: `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8)` with backdrop blur `backdrop-blur-md`.

### Named Rules
**The Single-Elevation Rule**: A surface is defined either by a 1px border or a soft ambient shadow, never both stacked aggressively.

---

## Shapes

- **Card Radii**: `16px` to `24px` for structural cards and panels (`var(--radius-xl)`).
- **Control Radii**: `8px` (`var(--radius-md)`) for inputs and action buttons; pills (`rounded-full`) exclusively for primary triggers and status chips.
- **Icons**: Clean, monoline vector SVGs (24x24 grid, 2px stroke, round line joins). No emoji used as functional icons.

---

## Components

### Buttons
- **Primary**: Pill button with `bg-accent`, white text, `font-medium`, smooth scale feedback on active press (`active:scale-97`).
- **Ghost / Secondary**: Transparent background, border with `var(--border)`, hover background `rgba(99, 91, 255, 0.05)`.

### Cards & Feed Items
- Background `var(--surface)` with 1px border `var(--border)`. Clean internal padding (16px to 24px).
- Status tags are integrated directly into header metadata rather than oversized banners.

### Form Inputs
- Background matching canvas, 1px border, 3px focus ring with `rgba(99, 91, 255, 0.2)`.

---

## Do's and Don'ts

### Do
- Use real vector SVG icons with consistent stroke weights.
- Group metrics cleanly with monospaced data values and subtle muted labels.
- Provide accessible touch targets ($\ge 44\times 44\text{px}$) and visible keyboard focus rings.
- Use smooth, non-intrusive CSS transitions ($\le 250\text{ms}$).

### Don't
- Don't use colored 4px left-border callouts (`border-l-4`).
- Don't put animated pinging eyebrow badges above main titles.
- Don't use emoji as replacement icons in buttons and headers (e.g., 🏋️, 🍔, 🎯).
- Don't allow horizontal overflow on mobile viewports.
