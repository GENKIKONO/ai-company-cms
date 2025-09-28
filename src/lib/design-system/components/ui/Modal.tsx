/**
 * Modal コンポーネント
 * 要件定義準拠: アクセシビリティAA、キーボードナビゲーション
 */

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const modalVariants = cva(
  [
    'fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%]',
    'gap-4 border bg-background p-6 shadow-lg duration-200',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
    'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
    'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
    'sm:rounded-lg',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        default: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-full max-h-full h-full w-full',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface ModalProps
  extends React.ComponentPropsWithoutRef<typeof Dialog.Root>,
    VariantProps<typeof modalVariants> {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
}

const Modal = React.forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  ModalProps
>(
  (
    {
      children,
      title,
      description,
      size,
      showCloseButton = true,
      onClose,
      open,
      onOpenChange,
      ...props
    },
    ref
  ) => {
    const handleOpenChange = (isOpen: boolean) => {
      if (!isOpen && onClose) {
        onClose();
      }
      onOpenChange?.(isOpen);
    };

    return (
      <Dialog.Root open={open} onOpenChange={handleOpenChange} {...props}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content
            ref={ref}
            className={cn(modalVariants({ size }))}
            onEscapeKeyDown={(e) => {
              if (onClose) {
                e.preventDefault();
                onClose();
              }
            }}
          >
            {title && (
              <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
                  {title}
                </Dialog.Title>
                {description && (
                  <Dialog.Description className="text-sm text-muted-foreground">
                    {description}
                  </Dialog.Description>
                )}
              </div>
            )}

            <div className="flex-1">{children}</div>

            {showCloseButton && (
              <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Dialog.Close>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }
);

Modal.displayName = 'Modal';

// Compound components for modal structure
const ModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className
    )}
    {...props}
  />
));

ModalHeader.displayName = 'ModalHeader';

const ModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
  />
));

ModalFooter.displayName = 'ModalFooter';

const ModalTitle = Dialog.Title;
const ModalDescription = Dialog.Description;
const ModalTrigger = Dialog.Trigger;
const ModalClose = Dialog.Close;

export {
  Modal,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  ModalTrigger,
  ModalClose,
  modalVariants,
};