/**
 * HIGButton - Legacy Alias for Unified Button
 *
 * @deprecated Use `Button` from '@/components/ui/button' instead.
 * This file is maintained for backward compatibility only.
 *
 * Migration:
 *   Before: import { HIGButton } from '@/components/ui/HIGButton';
 *   After:  import { Button } from '@/components/ui/button';
 */

import {
  Button,
  ButtonGroup,
  IconButton,
  LinkButton,
  buttonVariants,
  type ButtonProps,
  type ButtonGroupProps,
  type IconButtonProps,
  type LinkButtonProps,
} from './button';

// Re-export unified Button as HIGButton for backward compatibility
export const HIGButton = Button;
export const HIGLinkButton = LinkButton;

// Re-export types with legacy names
export type HIGButtonProps = ButtonProps;
export type HIGLinkButtonProps = LinkButtonProps;

// Re-export buttonVariants for any direct usage
export { buttonVariants };

// Default export for convenience
export default HIGButton;