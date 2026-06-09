import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { bundleMDX } from "mdx-bundler";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import remarkMath from "remark-math";
import katex from "katex";

const CONTENT_PATH = path.join(process.cwd(), "content");

export function listContentDirs() {
  if (!fs.existsSync(CONTENT_PATH)) return [];
  return fs.readdirSync(CONTENT_PATH).filter((f) => fs.statSync(path.join(CONTENT_PATH, f)).isDirectory());
}

export function getAllSlugs(section = "") {
  const dir = section ? path.join(CONTENT_PATH, section) : CONTENT_PATH;
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".mdx")).map((f) => f.replace(/\.mdx$/, ""));
}

export async function getContentBySlug(section: string, slug: string) {
  const filePath = path.join(CONTENT_PATH, section, `${slug}.mdx`);
  console.log("getContentBySlug filePath=", filePath);
  console.log("exists=", fs.existsSync(filePath));
  const source = fs.readFileSync(filePath, "utf8");
  // mdx-bundler needs esbuild binary path on some platforms; callers can set env if needed
  try {
    console.log("bundleMDX: source contains $$?", source.includes("$$"));
    const result = await bundleMDX({
      source,
      xdmOptions(options) {
        options.remarkPlugins = [...(options.remarkPlugins || []), remarkMath as any];

        options.rehypePlugins = [
          ...(options.rehypePlugins || []),
          rehypeHighlight as any,
          rehypeKatex as any,
        ];
        return options;
      },
    });

    const { code, frontmatter } = result;
    console.log("bundleMDX: output code includes katex markup?", code.includes("katex") || code.includes("katex-display") || code.includes("class=\"katex\""));
    console.log("bundleMDX: sample output code snippet:\n", code.slice(0, 800));
    return { code, frontmatter };
  } catch (err) {
    throw new Error(`Failed to bundle MDX for ${filePath}: ${String(err)}`);
  }
}

export function getFrontmatter(section: string, slug: string) {
  const filePath = path.join(CONTENT_PATH, section, `${slug}.mdx`);
  const raw = fs.readFileSync(filePath, "utf8");
  const { data } = matter(raw);
  return data;
}

export function renderHTMLWithKaTeX(html: string) {
  const codeBlocks: string[] = [];
  // Mask code blocks to avoid transforming math inside them
  html = html.replace(/<pre[\s\S]*?<\/pre>/gi, (m) => {
    const idx = codeBlocks.push(m) - 1;
    return `__CODE_BLOCK_${idx}__`;
  });

  // Display math: $$...$$
  html = html.replace(/\$\$([\s\S]+?)\$\$/g, (_m, expr) => {
    try {
      return katex.renderToString(expr.trim(), { displayMode: true });
    } catch (e) {
      return `<code class="katex-error">${String(e)}</code>`;
    }
  });

  // Inline math: $...$ (avoid $$)
  html = html.replace(/(^|[^$])\$([^$\n]+?)\$([^$]|$)/g, (m, p1, expr, p3) => {
    try {
      return p1 + katex.renderToString(expr.trim(), { displayMode: false }) + p3;
    } catch (e) {
      return p1 + `<code class="katex-error">${String(e)}</code>` + p3;
    }
  });

  // Restore code blocks
  html = html.replace(/__CODE_BLOCK_(\d+)__/g, (_m, n) => codeBlocks[Number(n)] || "");
  return html;
}
