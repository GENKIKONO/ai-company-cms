/**
 * HIG-Compliant Layout Components
 * Following Apple Human Interface Guidelines for layout and spacing
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Container Component
const containerVariants = cva(
  [
    'w-full',
    'mx-auto',
    'hig-safe-area',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-2xl',      // 672px
        md: 'max-w-4xl',      // 896px  
        lg: 'max-w-6xl',      // 1152px
        xl: 'max-w-7xl',      // 1280px (HIG max)
        full: 'max-w-none',
      },
      padding: {
        none: 'px-0',
        sm: 'px-4',
        md: 'px-6',
        lg: 'px-8',
      },
    },
    defaultVariants: {
      size: 'xl',
      padding: 'md',
    },
  }
);

export interface HIGContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

const HIGContainer = React.forwardRef<HTMLDivElement, HIGContainerProps>(
  ({ className, size, padding, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(containerVariants({ size, padding, className }))}
        {...props}
      />
    );
  }
);

HIGContainer.displayName = 'HIGContainer';

// Section Component with proper spacing
const sectionVariants = cva(
  [
    'w-full',
  ],
  {
    variants: {
      spacing: {
        none: 'py-0',
        sm: 'py-8',
        md: 'py-12',
        lg: 'py-16',
        xl: 'py-20',
        '2xl': 'py-24',
      },
      background: {
        transparent: 'bg-transparent',
        default: 'bg-[var(--color-background)]',
        secondary: 'bg-[var(--color-background-secondary)]',
        tertiary: 'bg-[var(--color-background-tertiary)]',
      },
    },
    defaultVariants: {
      spacing: 'lg',
      background: 'transparent',
    },
  }
);

export interface HIGSectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {
  as?: 'section' | 'div' | 'article' | 'aside' | 'main';
}

const HIGSection = React.forwardRef<HTMLDivElement, HIGSectionProps>(
  ({ className, spacing, background, as: Comp = 'section', ...props }, ref) => {
    return (
      <Comp
        ref={ref as any}
        className={cn(sectionVariants({ spacing, background, className }))}
        {...props}
      />
    );
  }
);

HIGSection.displayName = 'HIGSection';

// Stack Component for vertical spacing
const stackVariants = cva(
  [
    'flex',
    'flex-col',
  ],
  {
    variants: {
      spacing: {
        xs: 'hig-space-stack-xs',   // 4px
        sm: 'hig-space-stack-sm',   // 8px
        md: 'hig-space-stack-md',   // 16px
        lg: 'hig-space-stack-lg',   // 24px
        xl: 'hig-space-stack-xl',   // 32px
      },
      align: {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch',
      },
    },
    defaultVariants: {
      spacing: 'md',
      align: 'stretch',
    },
  }
);

export interface HIGStackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {}

const HIGStack = React.forwardRef<HTMLDivElement, HIGStackProps>(
  ({ className, spacing, align, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(stackVariants({ spacing, align, className }))}
        {...props}
      />
    );
  }
);

HIGStack.displayName = 'HIGStack';

// Grid Component with HIG-compliant spacing
const gridVariants = cva(
  [
    'hig-grid',
  ],
  {
    variants: {
      columns: {
        1: 'grid-cols-1',
        2: 'hig-grid--2-cols',
        3: 'hig-grid--3-cols',
        4: 'hig-grid--4-cols',
        auto: 'grid-cols-[repeat(auto-fit,minmax(280px,1fr))]',
      },
      gap: {
        sm: 'gap-4',
        md: 'gap-6',
        lg: 'gap-8',
        xl: 'gap-10',
      },
    },
    defaultVariants: {
      columns: 'auto',
      gap: 'lg',
    },
  }
);

export interface HIGGridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {}

const HIGGrid = React.forwardRef<HTMLDivElement, HIGGridProps>(
  ({ className, columns, gap, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(gridVariants({ columns, gap, className }))}
        {...props}
      />
    );
  }
);

HIGGrid.displayName = 'HIGGrid';

// Flex Component for horizontal layouts
const flexVariants = cva(
  [
    'flex',
  ],
  {
    variants: {
      direction: {
        row: 'flex-row',
        'row-reverse': 'flex-row-reverse',
        col: 'flex-col',
        'col-reverse': 'flex-col-reverse',
      },
      align: {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch',
        baseline: 'items-baseline',
      },
      justify: {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between',
        around: 'justify-around',
        evenly: 'justify-evenly',
      },
      gap: {
        xs: 'gap-1',
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6',
        xl: 'gap-8',
      },
      wrap: {
        true: 'flex-wrap',
        false: 'flex-nowrap',
        reverse: 'flex-wrap-reverse',
      },
    },
    defaultVariants: {
      direction: 'row',
      align: 'center',
      justify: 'start',
      gap: 'md',
      wrap: false,
    },
  }
);

export interface HIGFlexProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof flexVariants> {}

const HIGFlex = React.forwardRef<HTMLDivElement, HIGFlexProps>(
  ({ className, direction, align, justify, gap, wrap, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(flexVariants({ direction, align, justify, gap, wrap, className }))}
        {...props}
      />
    );
  }
);

HIGFlex.displayName = 'HIGFlex';

// Center Component for content centering
export interface HIGCenterProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: string;
  text?: boolean;
}

const HIGCenter = React.forwardRef<HTMLDivElement, HIGCenterProps>(
  ({ className, maxWidth, text = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'mx-auto',
          text && 'text-center',
          className
        )}
        style={maxWidth ? { maxWidth } : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

HIGCenter.displayName = 'HIGCenter';

// Spacer Component for consistent spacing
export interface HIGSpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  axis?: 'x' | 'y' | 'both';
}

const HIGSpacer: React.FC<HIGSpacerProps> = ({ 
  size = 'md', 
  axis = 'y' 
}) => {
  const sizeMap = {
    xs: 'var(--space-xs)',
    sm: 'var(--space-sm)', 
    md: 'var(--space-md)',
    lg: 'var(--space-lg)',
    xl: 'var(--space-xl)',
    '2xl': 'var(--space-2xl)',
    '3xl': 'var(--space-3xl)',
  };

  const spacing = sizeMap[size];

  const style: React.CSSProperties = {};
  
  if (axis === 'y' || axis === 'both') {
    style.height = spacing;
  }
  
  if (axis === 'x' || axis === 'both') {
    style.width = spacing;
  }

  return <div style={style} aria-hidden="true" />;
};

// Mobile-responsive Stack (switches between horizontal and vertical)
export interface HIGResponsiveStackProps
  extends React.HTMLAttributes<HTMLDivElement> {
  breakpoint?: 'sm' | 'md' | 'lg';
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end';
}

const HIGResponsiveStack = React.forwardRef<HTMLDivElement, HIGResponsiveStackProps>(
  ({ 
    className, 
    breakpoint = 'md', 
    spacing = 'md',
    align = 'start',
    children, 
    ...props 
  }, ref) => {
    const breakpointClass = {
      sm: 'sm:flex-row',
      md: 'md:flex-row',
      lg: 'lg:flex-row',
    }[breakpoint];

    const spacingClass = `gap-${spacing === 'xs' ? '1' : spacing === 'sm' ? '2' : spacing === 'md' ? '4' : spacing === 'lg' ? '6' : '8'}`;
    
    const alignClass = `items-${align}`;

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col',
          breakpointClass,
          spacingClass,
          alignClass,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

HIGResponsiveStack.displayName = 'HIGResponsiveStack';

export {
  HIGContainer,
  HIGSection,
  HIGStack,
  HIGGrid,
  HIGFlex,
  HIGCenter,
  HIGSpacer,
  HIGResponsiveStack,
  containerVariants,
  sectionVariants,
  stackVariants,
  gridVariants,
  flexVariants,
};