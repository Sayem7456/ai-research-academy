import React from "react";

type Props = {
  children: any;
  className?: string;
};

export default function CodeBlock({ children, className = "" }: Props) {
  const language = className.replace(/language-/, "") || "text";
  return (
    <pre className="rounded-md overflow-auto my-4 bg-gray-900 text-white p-4"> 
      <code className={`language-${language}`}>{children}</code>
    </pre>
  );
}
