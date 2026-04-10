interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  level?: "background" | "card" | "interactive";
  gloss?: boolean;
}

const levelClasses = {
  background: "glass-background",
  card: "glass-card",
  interactive: "glass-interactive",
} as const;

export function GlassPanel({
  children,
  className = "",
  level = "card",
  gloss = false,
}: GlassPanelProps) {
  const classes = [levelClasses[level], gloss ? "glass-gloss" : "", className]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
}
