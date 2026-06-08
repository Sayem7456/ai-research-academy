import Callout from "./Callout";
import Equation from "./Equation";
import CodeBlock from "./CodeBlock";

export const mdxComponents = {
  Callout,
  Equation,
  pre: CodeBlock,
  code: CodeBlock,
};

export { Callout, Equation, CodeBlock };
