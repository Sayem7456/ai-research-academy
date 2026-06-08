import React from "react";

type CalloutProps = {
  children: React.ReactNode;
  type?: "info" | "tip" | "warning" | "danger";
};

const colors: Record<string, string> = {
  info: "bg-blue-50 border-blue-200 text-blue-900",
  tip: "bg-green-50 border-green-200 text-green-900",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
  danger: "bg-red-50 border-red-200 text-red-900",
};

export default function Callout({ children, type = "info" }: CalloutProps) {
  const cls = colors[type] || colors.info;
  return (
    <div className={`rounded-md border p-4 my-4 ${cls}`}>
      <div className="prose prose-sm">{children}</div>
    </div>
  );
}
