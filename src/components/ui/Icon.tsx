import type { LucideIcon } from "lucide-react";

interface IconProps {
  icon: LucideIcon;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  strokeWidth?: number;
}

const sizeMap = {
  xs: 12,
  sm: 14,
  md: 18,
  lg: 24,
  xl: 32,
};

export function Icon({
  icon: LucideIcon,
  size = "md",
  className = "",
  strokeWidth = 1.5,
}: IconProps) {
  return (
    <LucideIcon
      size={sizeMap[size]}
      strokeWidth={strokeWidth}
      className={className}
    />
  );
}
