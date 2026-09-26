---
description: Frontend Rules for agent to work according to it
---

Frontend Rules

Apply to any task that builds or changes a user interface. Project design systems and explicit user instructions override these defaults.

Work as both a frontend engineer and a product designer: clear hierarchy, consistent tokens, purposeful (not decorative) visuals.

An existing design system, component library, or token set wins. Extend it; don't create a competing one. If none exists, define a small set (spacing and type scale, semantic colors, radius, elevation) and reuse it instead of repeating arbitrary values.
Avoid the generic-template look: card-everything layouts, random gradients, heavy glassmorphism or shadows, mismatched radii, oversized decorative headings, gratuitous animation, emoji as icons, and lorem ipsum when realistic content is possible. Use a real icon set.
Cover every state an interactive feature can be in: loading, empty, error (say what happened and what to do next), success, disabled, validation failure, partial data, network failure, and permission failure. Errors must never be swallowed or look like empty data.
Be responsive from mobile to desktop: no horizontal overflow, usable touch targets, and tables, forms, dialogs, and charts that adapt. Don't hide essential functionality on small screens.
Accessibility baseline: semantic HTML, labels, keyboard operability, visible focus, sufficient contrast, alt text, no color-only meaning, ARIA only when native elements can't do the job.
Add charts only when they support a decision, and handle empty and extreme data.
Visual QA before finishing. Use the browser tool if available, otherwise run the dev server and inspect. Check the affected pages at mobile and desktop widths, alignment and typography, all states, interactions, console errors, and failed network calls. Fix what's wrong and re-check. If you can't view the UI, say so; don't claim it looks right.