"use client";
import React, { useMemo } from "react";
import { mdxComponents } from "./mdx";

type Props = {
  code: string;
};

export default function MDXRenderer({ code }: Props) {
  const Content = useMemo(() => {
    // The code returned by mdx-bundler exports `MDXContent`
    const scope = { ...(mdxComponents as any), React };
    const fn = new Function("React", "_jsx_runtime", `${code}; return MDXContent`);
    return fn(React, require("react/jsx-runtime"));
  }, [code]);

  return (
    <article className="prose max-w-none">
      <Content components={mdxComponents as any} />
    </article>
  );
}
