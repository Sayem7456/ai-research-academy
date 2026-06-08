# Phase 1 Architecture — AI Research Learning Platform

Overview
- Frontend-only learning platform built with Next.js 15 App Router and TypeScript (strict).
- Feature-based architecture with explicit folders for `app`, `components`, `features`, `content`, `data`, `hooks`, `lib`, `store`, `types`, and `utils`.

Goals
- Clear separation of features (math, machine-learning, computer-vision, llm, research, practice).
- Route groups for each major track using Next.js App Router route groups.
- Centralized shared type system and constants for consistency.
- Path aliases for concise imports.
- No feature implementations in Phase 1 — scaffolding only.

Project Structure (created)
- `src/app/` — Next.js App Router entry; route groups created for major tracks.
- `src/components/` — shared UI components.
- `src/features/<feature>/` — feature-scoped subfolders, each containing `components/`, `hooks/`, `types/`, and `utils/`.
- `src/content/` — MDX/markdown content.
- `src/data/` — static JSON data (papers, algorithms, roadmaps).
- `src/hooks/` — shared hooks.
- `src/lib/` — cross-cutting utilities and runtime configuration.
- `src/store/` — client-side state (Zustand planned).
- `src/types/` — shared type system.
- `src/utils/` — generic helper utilities.

Path aliases (added to `tsconfig.json`)
- `@/*` -> `src/*`
- `@/components/*`, `@/features/*`, `@/content/*`, `@/data/*`, `@/hooks/*`, `@/lib/*`, `@/store/*`, `@/types/*`, `@/utils/*`

Design notes
- Each feature is an independent vertical slice to encourage encapsulation and testability.
- Shared types and constants live in `src/types` and `src/constants` to avoid duplication.
- Route groups use Next.js parentheses convention to group related routes without affecting URLs.
- Content is static (MDX) and is versioned with the repo; no backend or database in Phase 1.

Next steps
- Implement feature pages and components behind the scaffolds.
- Add Tailwind, Framer Motion, MDX, and other runtime deps to `package.json` and wire them into the layout.
- Add static data for papers, algorithms, and roadmaps.
