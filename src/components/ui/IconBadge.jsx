import { cn } from "@/lib/utils";

const SIZES = {
  xs: { container: "w-7 h-7 rounded-lg", icon: 14 },
  sm: { container: "w-10 h-10 rounded-xl", icon: 18 },
  md: { container: "w-14 h-14 rounded-2xl", icon: 24 },
  lg: { container: "w-20 h-20 rounded-2xl", icon: 32 },
  xl: { container: "w-24 h-24 rounded-2xl", icon: 40 },
};

export default function IconBadge({ icon: Icon, color = "#2d9f82", size = "sm", className }) {
  const s = SIZES[size] || SIZES.sm;
  return (
    <div
      className={cn("flex items-center justify-center flex-shrink-0", s.container, className)}
      style={{ backgroundColor: `${color}1a` }}
    >
      <Icon style={{ color, width: s.icon, height: s.icon }} />
    </div>
  );
}

export function InlineIcon({ icon: Icon, color = "#2d9f82", size = 14, className }) {
  return <Icon style={{ color, width: size, height: size }} className={cn("inline-block", className)} />;
}