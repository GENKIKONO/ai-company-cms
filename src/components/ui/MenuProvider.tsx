'use client';

import { createContext, useContext, useState, useCallback, useEffect, PropsWithChildren } from 'react';
import { useRouter } from 'next/navigation';

interface MenuContextType {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function useMenu(): MenuContextType {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
}

export function MenuProvider({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Body scroll lock when menu is open
  useEffect(() => {
    if (open) {
      // Store current overflow style
      const originalOverflow = document.body.style.overflow;
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Cleanup function
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  // Close menu on ESC key
  useEffect(() => {
    if (!open) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  const toggle = useCallback(() => {
    setOpen(prev => !prev);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    // Ensure scroll is unlocked
    document.body.style.overflow = '';
  }, []);

  // Close menu and unlock scroll on route changes
  useEffect(() => {
    const handleRouteChange = () => {
      close();
    };

    // Listen for route changes using performance.navigation API
    const handleBeforeUnload = () => {
      close();
    };

    // For internal navigation, we'll use the router's push override
    // Since Next.js 13+ App Router doesn't have router.events, we use pathname change detection
    let currentPath = window.location.pathname;
    const checkPathChange = () => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        handleRouteChange();
      }
    };

    // Use both popstate (back/forward) and a polling mechanism for navigation detection
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Polling fallback for detecting route changes
    const pathCheckInterval = setInterval(checkPathChange, 100);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(pathCheckInterval);
    };
  }, [close]);

  const value = {
    open,
    toggle,
    close
  };

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
}