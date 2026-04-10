import type { LucideIcon } from "lucide-react";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}

export function Button({
  children,
  variant = "secondary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  onClick,
  type = "button",
  className = "",
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantStyles = {
    primary: "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 hover:bg-accent-cyan/15",
    secondary: "bg-white/[0.04] text-white/80 border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12]",
    ghost: "text-white/60 hover:text-white hover:bg-white/[0.04]",
    danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15",
  };
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-label rounded-md",
    md: "px-4 py-2 text-body rounded-lg",
    lg: "px-5 py-2.5 text-body rounded-lg",
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      ) : Icon && iconPosition === "left" ? (
        <Icon size={iconSizes[size]} strokeWidth={2} />
      ) : null}
      {children}
      {!loading && Icon && iconPosition === "right" ? (
        <Icon size={iconSizes[size]} strokeWidth={2} />
      ) : null}
    </button>
  );
}
