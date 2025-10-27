// Simple toast hook for notifications
import { useState, useCallback } from 'react';
import { logger } from '@/lib/utils/logger';

export interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = useCallback((props: ToastProps) => {
    // Simple console-based toast for now
    logger.debug(`[TOAST ${props.variant || 'default'}] ${props.title}: ${props.description || ''}`);
    
    // Add alert for immediate feedback
    if (props.variant === 'destructive') {
      alert(`エラー: ${props.title}\n${props.description || ''}`);
    } else {
      alert(`${props.title}\n${props.description || ''}`);
    }

    setToasts(prev => [...prev, props]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, 5000);
  }, []);

  return { toast, toasts };
}