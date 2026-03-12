export const mdComponents = {
  p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
  ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
  li: ({ children }) => <li className="my-0.5">{children}</li>,
  h1: ({ children }) => <h1 className="text-lg font-semibold my-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-semibold my-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold my-2">{children}</h3>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-border pl-3 my-2 text-muted-foreground">{children}</blockquote>
  ),
  code: ({ inline, children }) =>
    inline ? (
      <code className="px-1 py-0.5 rounded bg-muted text-foreground text-xs">{children}</code>
    ) : (
      <pre className="bg-muted rounded-lg p-3 overflow-x-auto my-2 text-xs">
        <code>{children}</code>
      </pre>
    ),
};