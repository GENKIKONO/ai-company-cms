'use client';

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

export interface BackLinkProps extends React.HTMLAttributes<HTMLButtonElement> {
  fallbackUrl?: string;
  variant?: "default" | "ghost" | "outline";
  children?: React.ReactNode;
}

const BackLink = React.forwardRef<HTMLButtonElement, BackLinkProps>(
  ({ className, fallbackUrl = "/", variant = "ghost", children, ...props }, ref) => {
    const router = useRouter();

    const handleBack = () => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push(fallbackUrl);
      }
    };

    const baseClasses = "inline-flex items-center gap-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    
    const variants = {
      default: "text-foreground hover:text-primary",
      ghost: "text-muted-foreground hover:text-foreground",
      outline: "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2",
    };

    return (
      <button
        type="button"
        className={cn(
          baseClasses,
          variants[variant],
          className
        )}
        onClick={handleBack}
        ref={ref}
        {...props}
      >
        <ArrowLeftIcon className="h-4 w-4" />
        {children || "戻る"}
      </button>
    );
  }
);
BackLink.displayName = "BackLink";

export { BackLink };