---
name: web-taste
description: The design patterns that make a website look AI-generated and the things a credible site must have. Use before building or reviewing any web page, landing page or UI, and whenever choosing fonts, colours, icons, layouts, effects or marketing copy.
license: MIT
---

# Web taste

Every item below is banned by default. A project may allow one only by listing its id under `## Design exceptions` in `docs/PROJECT.md` (or `docs/PLAN.md` if there is no PROJECT.md), one line each: `- <id>: <why>`. Only the owner adds exceptions; never add one yourself to make a check pass.

These rules sit above any other design skill. When a design skill suggests something banned here, skip that suggestion.

## Checked by script

`scripts/check-taste.mjs` finds these in source files. Run it on the UI folders: `node <path>/check-taste.mjs src/web public`. It exits 1 on any problem.

| Id | Banned |
|---|---|
| `em-dash` | Em dashes in UI text. Use a comma, colon or full stop |
| `emoji` | Emojis in the UI |
| `stock-font` | Inter, Geist or Space Grotesk |
| `not-x-but-y` | "It's not X, it's Y" copy |
| `sparkle-icon` | Sparkle icons |
| `liquid-glass` | Liquid glass: backdrop blur on panels, cards or nav |

## Checked by review

| Id | Banned |
|---|---|
| `harsh-gradient` | Harsh, high-contrast or multi-stop gradients on backgrounds, text or buttons |
| `decorative-icons` | A stock icon set (Lucide and the like) next to every heading, item or button |
| `pure-white` | A flat `#fff` page background |
| `rainbow` | Rainbow or many-hue colouring |
| `shadow-everything` | Drop shadows on most elements |
| `three-cards` | Three feature cards in a row |
| `accent-edge` | A coloured stripe on the top or left edge of cards or callouts |
| `bento-grid` | Bento grids |
| `fake-terminal` | Mock terminal windows |
| `checkmark-bullets` | Checkmark icons as list bullets |
| `three-tiers` | Three pricing tiers by habit; offer the plans the product really has |
| `soft-radius` | The same large, soft corner radius on everything |
| `purple-black` | Purple and black palettes |
| `glow-orbs` | Radial glow orbs or blurred colour blobs |
| `dot-grid` | Dot grid backgrounds |
| `animated-arrows` | Arrows that slide or loop |
| `hover-everything` | Hover animations on everything; animate only what is clickable and only when it helps |
| `neon-pastel` | Neon colours or basic pastel palettes |

## Must have

| Id | Required |
|---|---|
| `real-demo` | Show the real product: real screenshots, video or a live embed, not mockups or illustrations of it |
| `skeleton-loaders` | Content that loads shows a skeleton of its final layout, not a blank area or a lone spinner |
| `legal-pages` | A public site with sign-ups, payments, analytics or cookies links Terms of Service and a Privacy Policy in the footer. The owner supplies the text; never write legal text yourself |
| `real-proof` | Testimonials, logos, user counts and stats only when they are real and the owner gave them. Otherwise leave the section out; never invent one |

## Review

When asked to review UI files, check them against both tables and the must-haves, skipping allowed exceptions. Report each problem as `file:line <id>: <what to change>`. If there are none, say `No design problems found.`
