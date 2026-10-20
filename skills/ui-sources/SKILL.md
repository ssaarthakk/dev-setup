---
name: ui-sources
description: Where to get ready-made animated and styled React components (shadcn registries such as Motion Primitives, Kokonut UI, bklit UI, Magic UI, Animate UI and Watermelon UI) and how to bring one into the project cleanly. Use when a UI feature needs a component the project doesn't have yet, in a React + Tailwind + shadcn project.
license: MIT
---

# UI sources

Use only the registries the project approved in `docs/ARCHITECTURE.md`. If it lists none, this skill doesn't apply.

## Registries

| Registry | Site | License | Good for |
|---|---|---|---|
| Motion Primitives | motion-primitives.com | MIT | Text effects, reveals, transitions, small motion building blocks |
| Kokonut UI | kokonutui.com | MIT | Polished marketing and app components |
| bklit UI | github.com/bklit/bklit-ui | MIT | Charts and data display |
| Magic UI | magicui.design | MIT | Animated landing page components |
| Animate UI | animate-ui.com | MIT + Commons Clause | Animated versions of shadcn primitives. Fine inside a product; never resell the components themselves |
| Watermelon UI | ui.watermelon.sh | MIT | Copy-paste shadcn components; small project, check each component's quality |

## Adding a component

1. Check the project's own components first. Reuse or extend one before adding another.
2. Check the component against `web-taste` if the project has it. Many registry showpieces are banned there (bento grids, glow orbs, sparkles, backdrop blur, animated borders). Pick something else, or the plain version.
3. Add it with the shadcn CLI version pinned in the project, using the install command from the component's page. Never paste code from anywhere else.
4. Make it the project's code: remove comments, demo content, unused props, variants and exports, and any dependency it added that the project doesn't need. Name it for what it does here.
5. Check its new dependencies against the approved list in `docs/ARCHITECTURE.md`. Ask before keeping any that aren't on it.
6. Run `check`.
