/**
 * HIG-Compliant Card Components
 * Follows Apple Human Interface Guidelines for card interfaces
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  [
    // Base HIG card styles
    'hig-card',
    'block',
    'w-full',
    'transition-all',
    'duration-150',
    'ease-out',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-[var(--color-background)]',
          'border',
          'border-[var(--color-border-secondary)]',
          'shadow-[var(--shadow-xs)]',
          'hover:shadow-[var(--shadow-sm)]',
        ],
        elevated: [
          'bg-[var(--color-background)]',
          'border',
          'border-[var(--color-border-secondary)]',
          'shadow-[var(--shadow-sm)]',
          'hover:shadow-[var(--shadow-md)]',
          'hover:transform',
          'hover:-translate-y-0.5',
        ],
        flat: [
          'bg-[var(--color-background)]',
          'border',
          'border-[var(--color-border-secondary)]',
        ],
        ghost: [
          'bg-transparent',
          'border-0',
        ],
        filled: [
          'bg-[var(--color-background-secondary)]',
          'border-0',
        ],
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      radius: {
        sm: 'rounded-lg',
        md: 'rounded-xl',
        lg: 'rounded-2xl',
      },
      interactive: {
        true: [
          'cursor-pointer',
          'focus-visible:outline-none',
          'focus-visible:ring-2',
          'focus-visible:ring-[var(--color-primary)]',
          'focus-visible:ring-offset-2',
          'active:scale-[0.99]',
        ],
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      radius: 'md',
      interactive: false,
    },
  }
);

export interface HIGCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

const HIGCard = React.forwardRef<HTMLDivElement, HIGCardProps>(
  ({ className, variant, padding, radius, interactive, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding, radius, interactive, className }))}
        {...props}
      />
    );
  }
);

HIGCard.displayName = 'HIGCard';

// Card Header Component
export interface HIGCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  actions?: React.ReactNode;
}

const HIGCardHeader = React.forwardRef<HTMLDivElement, HIGCardHeaderProps>(
  ({ className, actions, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-start justify-between gap-4',
          'pb-4',
          'border-b border-[var(--color-border-tertiary)]',
          className
        )}
        {...props}
      >
        <div className="flex-1 min-w-0">
          {children}
        </div>
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    );
  }
);

HIGCardHeader.displayName = 'HIGCardHeader';

// Card Title Component
const HIGCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    level?: 1 | 2 | 3 | 4 | 5 | 6;
  }
>(({ className, level = 3, children, ...props }, ref) => {
  const Component = React.createElement(
    `h${level}`,
    {
      ref,
      className: cn(
        'hig-text-h3',
        'hig-jp-heading',
        'text-[var(--color-text-primary)]',
        'leading-tight',
        className
      ),
      ...props,
    },
    children
  );
  
  return Component;
});

HIGCardTitle.displayName = 'HIGCardTitle';

// Card Description Component
const HIGCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn(
        'hig-text-caption',
        'hig-jp-body',
        'text-[var(--color-text-secondary)]',
        'mt-1',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
});

HIGCardDescription.displayName = 'HIGCardDescription';

// Card Content Component
const HIGCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'hig-space-stack-md',
        'pt-4',
        className
      )}
      {...props}
    />
  );
});

HIGCardContent.displayName = 'HIGCardContent';

// Card Footer Component
const HIGCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    justify?: 'start' | 'center' | 'end' | 'between';
  }
>(({ className, justify = 'end', ...props }, ref) => {
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-3',
        'pt-4',
        'border-t border-[var(--color-border-tertiary)]',
        justifyClasses[justify],
        className
      )}
      {...props}
    />
  );
});

HIGCardFooter.displayName = 'HIGCardFooter';

// Clickable Card Component (for navigation)
export interface HIGClickableCardProps extends HIGCardProps {
  href?: string;
  onClick?: () => void;
  external?: boolean;
}

const HIGClickableCard = React.forwardRef<
  HTMLElement,
  HIGClickableCardProps
>(({ href, onClick, external = false, children, ...props }, ref) => {
  if (href) {
    const linkProps = external ? {
      target: '_blank',
      rel: 'noopener noreferrer',
    } : {};

    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        {...linkProps}
      >
        <HIGCard interactive {...props}>
          {children}
        </HIGCard>
      </a>
    );
  }

  if (onClick) {
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        className="w-full text-left"
      >
        <HIGCard interactive {...props}>
          {children}
        </HIGCard>
      </button>
    );
  }

  return (
    <HIGCard ref={ref as React.Ref<HTMLDivElement>} {...props}>
      {children}
    </HIGCard>
  );
});

HIGClickableCard.displayName = 'HIGClickableCard';

// Card Grid Component
export interface HIGCardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
}

const HIGCardGrid = React.forwardRef<HTMLDivElement, HIGCardGridProps>(
  ({ className, columns = 3, gap = 'lg', children, ...props }, ref) => {
    const columnClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    };

    const gapClasses = {
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          columnClasses[columns],
          gapClasses[gap],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

HIGCardGrid.displayName = 'HIGCardGrid';

export {
  HIGCard,
  HIGCardHeader,
  HIGCardTitle,
  HIGCardDescription,
  HIGCardContent,
  HIGCardFooter,
  HIGClickableCard,
  HIGCardGrid,
  cardVariants,
};