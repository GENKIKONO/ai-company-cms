/**
 * Checkbox Component - P2-4で使用するチェックボックス
 * HIGデザインシステムに準拠
 */

import * as React from "react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'checked'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, disabled, id, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(event.target.checked)
    }

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={ref}
          id={id}
          checked={checked || false}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            // 基本スタイル
            "h-4 w-4 rounded border-2 transition-all duration-200 ease-in-out",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2",
            
            // 通常状態
            "border-[var(--color-border)] bg-[var(--color-background)]",
            "hover:border-[var(--color-primary-alpha-50)]",
            
            // チェック状態
            "checked:border-[var(--color-primary)] checked:bg-[var(--color-primary)]",
            "checked:hover:border-[var(--color-primary)] checked:hover:bg-[var(--color-primary)]",
            
            // 無効状態
            "disabled:border-[var(--color-border-disabled)] disabled:bg-[var(--color-background-disabled)]",
            "disabled:checked:border-[var(--color-text-disabled)] disabled:checked:bg-[var(--color-text-disabled)]",
            "disabled:cursor-not-allowed",
            
            // カスタムクラス
            className
          )}
          {...props}
        />
        
        {/* チェックアイコン */}
        {checked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              className={cn(
                "h-3 w-3 text-white",
                disabled && "text-[var(--color-background)]"
              )}
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
    )
  }
)

Checkbox.displayName = "Checkbox"

export { Checkbox }