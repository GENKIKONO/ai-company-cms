'use client';

import React, { createContext, useContext, useState } from 'react';

interface AlertDialogContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AlertDialogContext = createContext<AlertDialogContextType | undefined>(undefined);

interface AlertDialogProps {
  children: React.ReactNode;
}

interface AlertDialogTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

interface AlertDialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface AlertDialogHeaderProps {
  children: React.ReactNode;
}

interface AlertDialogFooterProps {
  children: React.ReactNode;
}

interface AlertDialogTitleProps {
  children: React.ReactNode;
}

interface AlertDialogDescriptionProps {
  children: React.ReactNode;
}

interface AlertDialogActionProps {
  children: React.ReactNode;
  onClick?: () => void;
}

interface AlertDialogCancelProps {
  children: React.ReactNode;
}

export function AlertDialog({ children }: AlertDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

export function AlertDialogTrigger({ asChild, children }: AlertDialogTriggerProps) {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error('AlertDialogTrigger must be used within an AlertDialog');
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: () => context.setOpen(true)
    });
  }

  return (
    <button onClick={() => context.setOpen(true)}>
      {children}
    </button>
  );
}

export function AlertDialogContent({ children, className = '' }: AlertDialogContentProps) {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error('AlertDialogContent must be used within an AlertDialog');
  }

  if (!context.open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => context.setOpen(false)} />
      <div className={`relative bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl ${className}`}>
        {children}
      </div>
    </div>
  );
}

export function AlertDialogHeader({ children }: AlertDialogHeaderProps) {
  return (
    <div className="mb-4">
      {children}
    </div>
  );
}

export function AlertDialogFooter({ children }: AlertDialogFooterProps) {
  return (
    <div className="flex justify-end space-x-2 mt-6">
      {children}
    </div>
  );
}

export function AlertDialogTitle({ children }: AlertDialogTitleProps) {
  return (
    <h2 className="text-lg font-semibold text-gray-900 mb-2">
      {children}
    </h2>
  );
}

export function AlertDialogDescription({ children }: AlertDialogDescriptionProps) {
  return (
    <p className="text-sm text-gray-600">
      {children}
    </p>
  );
}

export function AlertDialogAction({ children, onClick }: AlertDialogActionProps) {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error('AlertDialogAction must be used within an AlertDialog');
  }

  return (
    <button
      onClick={() => {
        onClick?.();
        context.setOpen(false);
      }}
      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
    >
      {children}
    </button>
  );
}

export function AlertDialogCancel({ children }: AlertDialogCancelProps) {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error('AlertDialogCancel must be used within an AlertDialog');
  }

  return (
    <button
      onClick={() => context.setOpen(false)}
      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
    >
      {children}
    </button>
  );
}