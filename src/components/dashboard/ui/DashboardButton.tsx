'use client';

/**
 * DashboardButton - Legacy Alias for Unified Button
 *
 * @deprecated Use `Button` from '@/components/ui/button' instead.
 * This file is maintained for backward compatibility only.
 *
 * Migration:
 *   Before: import { DashboardButton } from '@/components/dashboard/ui/DashboardButton';
 *   After:  import { Button } from '@/components/ui/button';
 */

import {
  Button,
  ButtonGroup,
  IconButton,
  buttonVariants,
  type ButtonProps,
  type ButtonGroupProps,
  type IconButtonProps,
} from '@/components/ui/button';

// Re-export unified Button as DashboardButton for backward compatibility
export const DashboardButton = Button;
export const DashboardButtonGroup = ButtonGroup;
export const DashboardIconButton = IconButton;

// Re-export types with legacy names
export type DashboardButtonProps = ButtonProps;
export type DashboardButtonGroupProps = ButtonGroupProps;
export type DashboardIconButtonProps = IconButtonProps;

// Re-export buttonVariants for any direct usage
export { buttonVariants };

// Default export for convenience
export default DashboardButton;
