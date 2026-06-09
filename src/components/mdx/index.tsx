import React from "react";
import Callout from "./Callout";
import Equation from "./Equation";
import CodeBlock from "./CodeBlock";

const Table = ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
  <table className="min-w-full border-collapse border border-border my-4" {...props}>{children}</table>
);
const Th = ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
  <th className="border border-border px-4 py-2 bg-muted font-semibold text-left" {...props}>{children}</th>
);
const Td = ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
  <td className="border border-border px-4 py-2" {...props}>{children}</td>
);
const Tr = ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr {...props}>{children}</tr>
);
const Thead = ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead {...props}>{children}</thead>
);
const Tbody = ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody {...props}>{children}</tbody>
);

export const mdxComponents = {
  Callout,
  Equation,
  pre: CodeBlock,
  code: CodeBlock,
  table: Table,
  thead: Thead,
  tbody: Tbody,
  tr: Tr,
  th: Th,
  td: Td,
};

export { Callout, Equation, CodeBlock };
