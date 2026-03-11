/**
 * markdown.js — Shared ReactMarkdown component overrides for chat-style UIs.
 *
 * Usage:
 *   import { mdComponents } from "@/lib/markdown";
 *   <ReactMarkdown components={mdComponents}>{text}</ReactMarkdown>
 */

export const mdComponents = {
  p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
  li: ({ children }) => <li className="my-0.5">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
};
