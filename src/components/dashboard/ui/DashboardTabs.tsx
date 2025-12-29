'use client';

/**
 * DashboardTabs - Stripe風タブナビゲーションコンポーネント
 *
 * 特徴:
 * - スムーズなアニメーション
 * - アクセシビリティ対応
 * - バッジ対応
 */

import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

// ============================================
// Context
// ============================================

interface TabsContextValue {
  value: string;
  onChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within DashboardTabs');
  }
  return context;
};

// ============================================
// Tabs Root
// ============================================

export interface DashboardTabsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 現在の値 */
  value: string;
  /** 値変更時のコールバック */
  onValueChange: (value: string) => void;
  /** デフォルト値（非制御モード） */
  defaultValue?: string;
}

export const DashboardTabs = React.forwardRef<HTMLDivElement, DashboardTabsProps>(
  ({ value, onValueChange, defaultValue, className, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const currentValue = value !== undefined ? value : internalValue;

    const handleChange = (newValue: string) => {
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    };

    return (
      <TabsContext.Provider value={{ value: currentValue, onChange: handleChange }}>
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);

DashboardTabs.displayName = 'DashboardTabs';

// ============================================
// Tab List
// ============================================

export interface DashboardTabListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 下線スタイル */
  variant?: 'underline' | 'pills';
}

export const DashboardTabList = React.forwardRef<HTMLDivElement, DashboardTabListProps>(
  ({ className, variant = 'underline', ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      className={cn(
        'flex',
        variant === 'underline' && 'border-b border-[var(--dashboard-card-border)] gap-6',
        variant === 'pills' && 'bg-[var(--aio-muted)] p-1 rounded-lg gap-1',
        className
      )}
      {...props}
    />
  )
);

DashboardTabList.displayName = 'DashboardTabList';

// ============================================
// Tab Trigger
// ============================================

export interface DashboardTabTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** タブの値 */
  value: string;
  /** バッジ */
  badge?: React.ReactNode;
  /** アイコン */
  icon?: React.ReactNode;
}

export const DashboardTabTrigger = React.forwardRef<HTMLButtonElement, DashboardTabTriggerProps>(
  ({ className, value, badge, icon, children, ...props }, ref) => {
    const { value: currentValue, onChange } = useTabsContext();
    const isActive = currentValue === value;

    return (
      <button
        ref={ref}
        role="tab"
        type="button"
        aria-selected={isActive}
        onClick={() => onChange(value)}
        className={cn(
          'relative flex items-center gap-2 px-1 py-3',
          'text-sm font-medium',
          'transition-colors duration-150',
          'outline-none focus-visible:ring-2 focus-visible:ring-[var(--aio-primary)] focus-visible:ring-offset-2',
          isActive
            ? 'text-[var(--aio-primary)]'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
          className
        )}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
        {badge}
        {/* Active indicator */}
        {isActive && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--aio-primary)] rounded-t-full" />
        )}
      </button>
    );
  }
);

DashboardTabTrigger.displayName = 'DashboardTabTrigger';

// ============================================
// Tab Content
// ============================================

export interface DashboardTabContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** タブの値 */
  value: string;
}

export const DashboardTabContent = React.forwardRef<HTMLDivElement, DashboardTabContentProps>(
  ({ value, className, children, ...props }, ref) => {
    const { value: currentValue } = useTabsContext();

    if (currentValue !== value) {
      return null;
    }

    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn('pt-6', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DashboardTabContent.displayName = 'DashboardTabContent';

// ============================================
// Simple Tab Nav (for page navigation)
// ============================================

export interface TabNavItem {
  value: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface DashboardTabNavProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onSelect'> {
  items: TabNavItem[];
  activeValue: string;
  onSelect?: (value: string) => void;
}

export const DashboardTabNav = React.forwardRef<HTMLElement, DashboardTabNavProps>(
  ({ items, activeValue, onSelect, className, ...props }, ref) => (
    <nav
      ref={ref}
      className={cn('flex border-b border-[var(--dashboard-card-border)] gap-6', className)}
      {...props}
    >
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          disabled={item.disabled}
          onClick={() => onSelect?.(item.value)}
          className={cn(
            'relative flex items-center gap-2 px-1 py-3',
            'text-sm font-medium',
            'transition-colors duration-150',
            'outline-none',
            item.disabled && 'opacity-50 cursor-not-allowed',
            activeValue === item.value
              ? 'text-[var(--aio-primary)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          )}
        >
          {item.icon}
          {item.label}
          {item.badge}
          {activeValue === item.value && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--aio-primary)] rounded-t-full" />
          )}
        </button>
      ))}
    </nav>
  )
);

DashboardTabNav.displayName = 'DashboardTabNav';
