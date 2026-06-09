import React from "react";
import { getContentBySlug, renderHTMLWithKaTeX, getAllSlugs } from "@/lib/content";
import { mdxComponents } from "@/components/mdx";

type Props = { params: { section: string; slug: string } };

const SECTION_LABELS: Record<string, string> = {
  math: "Mathematics",
  ml: "Machine Learning",
  cv: "Computer Vision",
  llm: "Large Language Models",
  research: "Research Skills",
};

export default async function Page({ params }: Props) {
  const { section, slug } = (await params) as unknown as { section: string; slug: string };

  try {
    const { code, frontmatter } = await getContentBySlug(section, slug);

    const mod = new Function(
      "React",
      "_jsx_runtime",
      `${code}; return typeof MDXContent !== 'undefined' ? MDXContent : (typeof exports !== 'undefined' ? exports : undefined)`
    )(React, require("react/jsx-runtime"));

    const MDXComponent = (mod && (mod as any).default) || mod;
    const ReactDOMServer = require("react-dom/server");
    const rendered = ReactDOMServer.renderToStaticMarkup(
      React.createElement(MDXComponent, { components: mdxComponents as any })
    );
    const renderedWithMath = renderHTMLWithKaTeX(rendered);

    // Find neighboring lessons for navigation
    const allSlugs = getAllSlugs(section);
    const currentIndex = allSlugs.indexOf(slug);
    const prevSlug = currentIndex > 0 ? allSlugs[currentIndex - 1] : null;
    const nextSlug = currentIndex < allSlugs.length - 1 ? allSlugs[currentIndex + 1] : null;

    const sectionLabel = SECTION_LABELS[section] || section;

    // Format the slug into a readable title fallback
    const slugTitle = slug
      .replace(/^(la|calc|prob|stat|ml|cv|llm)-/, "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <a href="/" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              Home
            </a>
            <span>/</span>
            <a href={`/${section}`} className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              {sectionLabel}
            </a>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium truncate">
              {frontmatter?.title || slugTitle}
            </span>
          </nav>

          {/* Article */}
          <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-10">
            {/* Header */}
            <header className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                {frontmatter?.title || slugTitle}
              </h1>
              {frontmatter?.tags && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {frontmatter.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </header>

            {/* MDX Content */}
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: renderedWithMath }}
            />
          </article>

          {/* Navigation: Previous / Next */}
          <div className="flex items-center justify-between mt-6 gap-4">
            {prevSlug ? (
              <a
                href={`/content/${section}/${prevSlug}`}
                className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors group"
              >
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <div className="text-left">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Previous</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {prevSlug.replace(/^(la|calc|prob|stat)-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </div>
                </div>
              </a>
            ) : (
              <div />
            )}
            {nextSlug ? (
              <a
                href={`/content/${section}/${nextSlug}`}
                className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors group"
              >
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Next</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {nextSlug.replace(/^(la|calc|prob|stat)-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            ) : (
              <div />
            )}
          </div>
        </div>
      </main>
    );
  } catch (err) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="text-5xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Content not found
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            The lesson <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm">{section}/{slug}</code> could not be loaded.
          </p>
          <a
            href={`/${section}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Back to {SECTION_LABELS[section] || section}
          </a>
        </div>
      </main>
    );
  }
}
