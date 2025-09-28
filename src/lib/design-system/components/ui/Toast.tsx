/**
 * Toast コンポーネント
 * 要件定義準拠: ユーザーフィードバック、アクセシビリティAA
 */

import React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const toastVariants = cva(
  [
    'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
    'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
    'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[swipe=end]:animate-out data-[state=closed]:fade-out-80',
    'data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full',
    'data-[state=open]:sm:slide-in-from-bottom-full',
  ],
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        success: 'border-green-200 bg-green-50 text-green-900',
        error: 'border-red-200 bg-red-50 text-red-900',
        warning: 'border-yellow-200 bg-yellow-50 text-yellow-900',
        info: 'border-blue-200 bg-blue-50 text-blue-900',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  default: Info,
};

export interface ToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root>,
    VariantProps<typeof toastVariants> {
  title?: string;
  description?: string;
  showIcon?: boolean;
  onClose?: () => void;
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  ToastProps
>(
  (
    {
      className,
      variant = 'default',
      title,
      description,
      children,
      showIcon = true,
      onClose,
      ...props
    },
    ref
  ) => {
    const Icon = iconMap[variant || 'default'];

    return (
      <ToastPrimitive.Root
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-start space-x-3">
          {showIcon && (
            <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <div className="flex-1 space-y-1">
            {title && (
              <ToastPrimitive.Title className="text-sm font-semibold">
                {title}
              </ToastPrimitive.Title>
            )}
            {description && (
              <ToastPrimitive.Description className="text-sm opacity-90">
                {description}
              </ToastPrimitive.Description>
            )}
            {children}
          </div>
        </div>
        <ToastPrimitive.Close
          className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600"
          toast-close=""
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </ToastPrimitive.Close>
      </ToastPrimitive.Root>
    );
  }
);

Toast.displayName = ToastPrimitive.Root.displayName;

// Toast Provider and Context
const ToastProvider = ToastPrimitive.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
      className
    )}
    {...props}
  />
));

ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

// Toast hook for easy usage
export interface ToastData {
  id: string;
  title?: string;
  description?: string;
  variant?: VariantProps<typeof toastVariants>['variant'];
  duration?: number;
}

export interface ToastContextType {
  toast: (data: Omit<ToastData, 'id'>) => void;
  dismiss: (id: string) => void;
  toasts: ToastData[];
}

const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined
);

export const useToast = (): ToastContextType => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast Manager Component
export interface ToastManagerProps {
  children: React.ReactNode;
  swipeDirection?: 'right' | 'left' | 'up' | 'down';
}

export const ToastManager: React.FC<ToastManagerProps> = ({
  children,
  swipeDirection = 'right',
}) => {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  const toast = React.useCallback((data: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastData = {
      id,
      duration: 5000,
      ...data,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, newToast.duration);
    }
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const contextValue: ToastContextType = {
    toast,
    dismiss,
    toasts,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      <ToastProvider swipeDirection={swipeDirection}>
        {children}
        {toasts.map((toastData) => (
          <Toast
            key={toastData.id}
            variant={toastData.variant}
            title={toastData.title}
            description={toastData.description}
            duration={toastData.duration}
            onClose={() => dismiss(toastData.id)}
          />
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  );
};

export { Toast, ToastProvider, ToastViewport, toastVariants };