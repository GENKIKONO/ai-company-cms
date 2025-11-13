import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon" | "cta";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseClasses = "hig-button inline-flex items-center justify-center font-medium transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 hig-jp-nowrap";
    
    const variants = {
      default: "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] shadow-[var(--shadow-xs)]",
      destructive: "bg-[var(--color-error)] text-white hover:opacity-90 shadow-[var(--shadow-xs)]",
      outline: "border border-[var(--color-border-primary)] bg-[var(--color-background)] hover:bg-[var(--color-background-secondary)]",
      secondary: "bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border-secondary)]",
      ghost: "hover:bg-[var(--color-background-secondary)] text-[var(--color-text-primary)]",
      link: "text-[var(--color-primary)] underline-offset-4 hover:underline",
    };

    const sizes = {
      default: "h-11 px-[var(--space-md)] py-[var(--space-xs)] rounded-[var(--radius-lg)]",
      sm: "h-10 px-[var(--space-sm)] rounded-[var(--radius-md)]",
      lg: "h-12 px-[var(--space-lg)] rounded-[var(--radius-lg)]",
      icon: "h-[var(--tap-target-size)] w-[var(--tap-target-size)] rounded-[var(--radius-lg)]",
      cta: "h-12 px-[var(--space-lg)] rounded-[var(--radius-lg)]",
    };

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };