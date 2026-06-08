# Content System (Phase 4)

This document describes the MDX content system scaffolded for Phase 4.

Key pieces:

- `content/` — top-level content folders (`math`, `ml`, `cv`, `llm`, `research`).
- `src/lib/content.ts` — loader utilities: `getContentBySlug`, `getAllSlugs`, `getFrontmatter`.
- `src/components/mdx/*` — reusable MDX components (`Callout`, `Equation`, `CodeBlock`).
- `content/*/*.mdx` — place MDX files here; frontmatter supported via YAML.

MDX processing uses `mdx-bundler` with `remark-math` and `rehype-katex` for math and `rehype-pretty-code` for syntax highlighting. KaTeX CSS is imported in `Equation`.

Next steps:
- Install new dependencies: run `pnpm install` or `npm install` to add MDX-related packages.
- Wire `mdxComponents` into your MDX rendering context (e.g., via `MDXProvider` or when rendering code returned from `getContentBySlug`).
- Optionally configure Next.js to treat `.mdx` as pages using `@next/mdx` if you want filesystem routing.
