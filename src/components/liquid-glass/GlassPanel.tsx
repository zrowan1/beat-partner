interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  level?: "background" | "card" | "interactive";
  gloss?: boolean;
  onClick?: (e: React.MouseEvent) => void;
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
  onClick,
}: GlassPanelProps) {
  const classes = [
    levelClasses[level], 
    gloss ? "glass-gloss" : "", 
    className
  ].filter(Boolean).join(" ");

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
}
