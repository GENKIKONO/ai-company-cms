/**
 * AccessibleNavigation コンポーネント
 * 要件定義準拠: アクセシビリティAA、キーボードナビゲーション
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { useKeyboardNavigation } from '../../accessibility';
import { VisuallyHidden } from '../ui/VisuallyHidden';

export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  children?: NavigationItem[];
}

export interface AccessibleNavigationProps {
  items: NavigationItem[];
  label: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  onItemSelect?: (item: NavigationItem) => void;
}

export const AccessibleNavigation: React.FC<AccessibleNavigationProps> = ({
  items,
  label,
  orientation = 'horizontal',
  className,
  onItemSelect,
}) => {
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());
  const navRef = React.useRef<HTMLElement>(null);

  // Handle keyboard navigation
  useKeyboardNavigation(
    ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Space', 'Home', 'End'],
    (key: string, event: KeyboardEvent) => {
      const isVertical = orientation === 'vertical';
      const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
      const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

      switch (key) {
        case nextKey:
          event.preventDefault();
          setFocusedIndex(prev => (prev + 1) % items.length);
          break;
        case prevKey:
          event.preventDefault();
          setFocusedIndex(prev => (prev - 1 + items.length) % items.length);
          break;
        case 'Home':
          event.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          event.preventDefault();
          setFocusedIndex(items.length - 1);
          break;
        case 'Enter':
        case 'Space':
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < items.length) {
            const item = items[focusedIndex];
            handleItemActivation(item, event as any);
          }
          break;
      }
    },
    [items, orientation, focusedIndex]
  );

  const handleItemActivation = (item: NavigationItem, event: React.KeyboardEvent | React.MouseEvent) => {
    if (item.disabled) return;

    if (item.children && item.children.length > 0) {
      // Toggle submenu
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(item.id)) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
        return newSet;
      });
    } else {
      // Handle leaf item
      if (item.onClick) {
        item.onClick();
      }
      onItemSelect?.(item);
    }
  };

  const renderNavigationItem = (item: NavigationItem, index: number, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isFocused = focusedIndex === index;

    const itemProps = {
      role: hasChildren ? 'button' : 'menuitem',
      tabIndex: isFocused ? 0 : -1,
      'aria-expanded': hasChildren ? isExpanded : undefined,
      'aria-disabled': item.disabled,
      'aria-current': item.active ? ('page' as const) : undefined,
      className: cn(
        'block px-4 py-2 text-sm transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'hover:bg-accent hover:text-accent-foreground',
        {
          'bg-accent text-accent-foreground': item.active,
          'text-muted-foreground cursor-not-allowed': item.disabled,
          'pl-8': level > 0,
        }
      ),
      onClick: (event: React.MouseEvent) => {
        if (!item.disabled) {
          handleItemActivation(item, event);
        }
      },
      onFocus: () => setFocusedIndex(index),
    };

    return (
      <React.Fragment key={item.id}>
        {item.href ? (
          <a href={item.href} {...itemProps}>
            {item.label}
            {hasChildren && (
              <VisuallyHidden>
                {isExpanded ? ', 折りたたみ' : ', 展開'}
              </VisuallyHidden>
            )}
          </a>
        ) : (
          <div {...itemProps}>
            {item.label}
            {hasChildren && (
              <VisuallyHidden>
                {isExpanded ? ', 折りたたみ' : ', 展開'}
              </VisuallyHidden>
            )}
          </div>
        )}
        
        {hasChildren && isExpanded && (
          <div
            role="menu"
            aria-labelledby={item.id}
            className="pl-4 border-l border-border ml-4"
          >
            {item.children!.map((child, childIndex) =>
              renderNavigationItem(child, items.length + childIndex, level + 1)
            )}
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <nav
      ref={navRef}
      role="navigation"
      aria-label={label}
      className={cn('bg-background', className)}
    >
      <div
        role="menubar"
        aria-orientation={orientation}
        className={cn(
          'flex',
          orientation === 'vertical' ? 'flex-col' : 'flex-row'
        )}
      >
        {items.map((item, index) => renderNavigationItem(item, index))}
      </div>
    </nav>
  );
};

// Breadcrumb Navigation Component
export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
}

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  items,
  separator = '/',
  className,
}) => {
  return (
    <nav aria-label="パンくずリスト" className={className}>
      <ol className="flex items-center space-x-2 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-muted-foreground" aria-hidden="true">
                {separator}
              </span>
            )}
            {item.current ? (
              <span aria-current="page" className="font-medium">
                {item.label}
              </span>
            ) : item.href ? (
              <a
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <span className="text-muted-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};