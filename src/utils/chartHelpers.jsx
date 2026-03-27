/**
 * chartHelpers.jsx — Shared Recharts components & helpers.
 */

/**
 * Generic Recharts custom tooltip.
 * Works with any Bar/Area chart that has named payload entries.
 *
 * Usage in a chart:
 *   <Tooltip content={<CustomTooltip />} />
 *
 * Each payload entry can optionally carry a `unit` property (set via the
 * `unit` prop on <Bar> / <Area>) to append a unit suffix (e.g. "kg", "min").
 */
export const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}{p.unit ?? ""}
        </p>
      ))}
    </div>
  );
};
