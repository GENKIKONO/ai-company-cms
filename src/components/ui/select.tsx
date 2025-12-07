'use client';

import React from 'react';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

interface SelectValueProps {
  placeholder?: string;
}

export function Select({ value, onValueChange, children, disabled }: SelectProps) {
  // Extract options from children
  const options: Array<{ value: string; children: React.ReactNode }> = [];
  
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === SelectContent) {
      React.Children.forEach(child.props.children, (item) => {
        if (React.isValidElement(item) && item.type === SelectItem && item.props && typeof item.props === 'object' && 'value' in item.props && 'children' in item.props) {
          options.push({ value: item.props.value as string, children: item.props.children as React.ReactNode });
        }
      });
    }
  });

  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      disabled={disabled}
      className="w-full px-[var(--space-sm)] py-[var(--space-xs)] hig-text-body bg-[var(--color-background)] border border-[var(--color-border-primary)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition-all duration-[var(--duration-fast)]"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.children}
        </option>
      ))}
    </select>
  );
}

export function SelectTrigger({ children, className = '' }: SelectTriggerProps) {
  return <div className={className}>{children}</div>;
}

export function SelectContent({ children }: SelectContentProps) {
  return <>{children}</>;
}

export function SelectItem({ value, children }: SelectItemProps) {
  return <option value={value}>{children}</option>;
}

export function SelectValue({ placeholder }: SelectValueProps) {
  return <span className="text-[var(--color-text-tertiary)]">{placeholder}</span>;
}