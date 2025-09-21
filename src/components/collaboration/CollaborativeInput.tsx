'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { debounce } from 'lodash';
import { collaborationService, CollaborationUser, FieldEdit } from '@/lib/collaboration';

interface CollaborativeInputProps {
  fieldPath: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
}

export default function CollaborativeInput({
  fieldPath,
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  className = '',
  disabled = false,
  multiline = false,
  rows = 3,
}: CollaborativeInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isLocked, setIsLocked] = useState(false);
  const [editor, setEditor] = useState<CollaborationUser | null>(null);
  const [recentEdit, setRecentEdit] = useState<FieldEdit | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Debounced broadcast function
  const debouncedBroadcast = useCallback(
    debounce((newValue: string) => {
      collaborationService.broadcastFieldEdit(fieldPath, newValue);
    }, 300),
    [fieldPath]
  );

  // Check if field is locked by another user
  useEffect(() => {
    const checkLockStatus = () => {
      const locked = collaborationService.isFieldLocked(fieldPath);
      const fieldEditor = collaborationService.getFieldEditor(fieldPath);
      const currentUser = collaborationService.getCurrentUser();
      
      setIsLocked(locked && fieldEditor?.id !== currentUser?.id);
      setEditor(fieldEditor);
    };

    checkLockStatus();

    // Listen for collaboration state changes
    collaborationService.onStateChanged(checkLockStatus);
    collaborationService.onFieldEdit((edit) => {
      if (edit.fieldPath === fieldPath && edit.userId !== collaborationService.getCurrentUser()?.id) {
        setRecentEdit(edit);
        setLocalValue(edit.value);
        onChange(edit.value);
        
        // Clear recent edit indicator after 3 seconds
        setTimeout(() => setRecentEdit(null), 3000);
      }
    });

    return () => {
      // Cleanup listeners would go here if supported by the service
    };
  }, [fieldPath, onChange]);

  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleFocus = useCallback(async () => {
    setIsFocused(true);
    onFocus?.();
    
    // Lock the field for editing
    await collaborationService.lockField(fieldPath);
    
    // Update cursor position
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      await collaborationService.broadcastCursorMove(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        fieldPath
      );
    }
  }, [fieldPath, onFocus]);

  const handleBlur = useCallback(async () => {
    setIsFocused(false);
    onBlur?.();
    
    // Unlock the field
    await collaborationService.unlockField(fieldPath);
    
    // Clear cursor
    await collaborationService.broadcastCursorMove(0, 0);
  }, [fieldPath, onBlur]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
    
    // Broadcast the change
    debouncedBroadcast(newValue);
  }, [onChange, debouncedBroadcast]);

  const handleMouseMove = useCallback(async (e: React.MouseEvent) => {
    if (isFocused) {
      await collaborationService.broadcastCursorMove(e.clientX, e.clientY, fieldPath);
    }
  }, [isFocused, fieldPath]);

  const baseClassName = `
    relative block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm 
    ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 
    focus:ring-2 focus:ring-inset focus:ring-indigo-600 
    sm:text-sm sm:leading-6 transition-all duration-200
    ${isLocked ? 'bg-red-50 ring-red-300 cursor-not-allowed' : 'bg-white'}
    ${recentEdit ? 'ring-green-400 bg-green-50' : ''}
    ${isFocused ? 'ring-indigo-600' : ''}
    ${className}
  `;

  const inputProps = {
    ref: inputRef as any,
    value: localValue,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onMouseMove: handleMouseMove,
    placeholder,
    disabled: disabled || isLocked,
    className: baseClassName,
  };

  return (
    <div className="relative">
      {multiline ? (
        <textarea {...inputProps} rows={rows} />
      ) : (
        <input {...inputProps} type="text" />
      )}
      
      {/* Collaboration indicators */}
      {isLocked && editor && (
        <div className="absolute -top-6 left-0 flex items-center space-x-1 text-xs">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: editor.color }}
          />
          <span className="text-red-600 font-medium">
            {editor.name}が編集中
          </span>
        </div>
      )}
      
      {recentEdit && (
        <div className="absolute -top-6 right-0 flex items-center space-x-1 text-xs">
          <div
            className="w-2 h-2 rounded-full bg-green-500"
          />
          <span className="text-green-600 font-medium">
            {recentEdit.userName}により更新
          </span>
        </div>
      )}
      
      {isFocused && (
        <div className="absolute -bottom-6 left-0 text-xs text-indigo-600">
          編集中... 他のユーザーにリアルタイムで共有されています
        </div>
      )}
    </div>
  );
}