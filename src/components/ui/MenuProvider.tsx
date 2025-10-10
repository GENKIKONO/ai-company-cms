'use client';

import { createContext, useContext, useState, useCallback, useEffect, PropsWithChildren } from 'react';

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
  }, []);

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