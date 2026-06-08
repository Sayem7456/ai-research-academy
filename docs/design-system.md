# Design System — Phase 2

Goals
- Tailwind-only design system with light/dark modes, accessible colors, and responsive primitives.

Tokens
- Colors are exposed as CSS variables in `src/app/globals.css` and mapped in `tailwind.config.cjs` so Tailwind utilities can consume them via `bg-[rgb(var(--color-primary))]`, etc.
- Dark mode uses the `dark` class on the `<html>` element.

Typography & Spacing
- `font-sans` uses Inter (system fallback). Scale through Tailwind's text utilities.
- Spacing uses Tailwind's spacing scale; extend in `tailwind.config.cjs` if needed.

Components
- `Button` — variants: `primary`, `secondary`, `ghost`; sizes: `sm`, `md`, `lg`.
- `Card` — bordered, rounded container.
- `Badge` — compact pill.
- `Alert` — `info|success|danger|warning`.
- `Tabs` — accessible tablist.
- `Dialog` — overlay modal with Escape to close.
- `Accordion` — vertical disclosure list.
- `Tooltip` — hover tooltip using `group-hover`.

Usage
- Import components from `src/components/ui`.
- Toggle dark mode by adding or removing the `dark` class on the root element (e.g., `<html className="dark">`).

Accessibility
- Components include basic ARIA attributes (`role="status"`, `role="tablist"`, `aria-expanded`, etc.).
- Color choices use sufficient contrast; tune tokens in `src/app/globals.css`.

Next steps
- Add focus-visible utilities, keyboard traps for `Dialog`, and unit tests for components.
