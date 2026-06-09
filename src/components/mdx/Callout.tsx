import React from "react";

type CalloutProps = {
  children: React.ReactNode;
  type?: "info" | "tip" | "warning" | "danger";
};

const colors: Record<string, string> = {
  info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200",
  tip: "bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200",
  danger: "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200",
};

export default function Callout({ children, type = "info" }: CalloutProps) {
  const cls = colors[type] || colors.info;
  return (
    <div className={`rounded-md border p-4 my-4 ${cls}`}>
      {children}
    </div>
  );
}
