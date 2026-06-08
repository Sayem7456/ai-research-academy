import React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

type Props = {
  children: string;
  display?: boolean;
};

export default function Equation({ children, display = true }: Props) {
  const html = katex.renderToString(String(children), {
    throwOnError: false,
    displayMode: display,
  });

  return <div className="katex" dangerouslySetInnerHTML={{ __html: html }} />;
}
