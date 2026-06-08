import React from "react";
import { getContentBySlug, renderHTMLWithKaTeX } from "../../../lib/content";
import { mdxComponents } from "../../../components/mdx";

type Props = { params: { section: string; slug: string } };

export default async function Page({ params }: Props) {
  const { section, slug } = (await params) as unknown as { section: string; slug: string };
  try {
    const { code, frontmatter } = await getContentBySlug(section, slug);

    // Evaluate the bundled MDX code on the server to a React component
    const mod = new Function("React", "_jsx_runtime", `${code}; return typeof MDXContent !== 'undefined' ? MDXContent : (typeof exports !== 'undefined' ? exports : undefined)`)(
      React,
      require("react/jsx-runtime")
    );
    const MDXComponent = (mod && (mod as any).default) || mod;
    const ReactDOMServer = require("react-dom/server");
    const rendered = ReactDOMServer.renderToStaticMarkup(
      React.createElement(MDXComponent, { components: mdxComponents as any })
    );
    const renderedWithMath = renderHTMLWithKaTeX(rendered);

    return (
      <main className="p-6">
        <h1 className="text-3xl font-bold">{frontmatter?.title || slug}</h1>
        <div className="mt-6 prose" dangerouslySetInnerHTML={{ __html: renderedWithMath }} />
      </main>
    );
  } catch (err) {
    return (
      <main className="p-6">
        <h1 className="text-2xl">Content not found</h1>
        <pre className="mt-4 text-sm text-red-600">{String(err)}</pre>
      </main>
    );
  }
}
