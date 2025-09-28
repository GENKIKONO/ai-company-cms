/**
 * FormField コンポーネント
 * 要件定義準拠: フォーム体験最適化、統一されたエラーハンドリング
 */

import React from 'react';
import { useController, Control, FieldPath, FieldValues } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Input, InputProps } from '../ui/Input';
import { Textarea, TextareaProps } from '../ui/Textarea';

// Base FormField Props
export interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  control: Control<TFieldValues>;
  label?: string;
  description?: string;
  required?: boolean;
  className?: string;
}

// Input FormField
export interface FormInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends FormFieldProps<TFieldValues, TName>,
    Omit<InputProps, 'name' | 'error' | 'required' | 'label' | 'description'> {}

export function FormInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  label,
  description,
  required,
  className,
  ...inputProps
}: FormInputProps<TFieldValues, TName>) {
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  return (
    <div className={cn('space-y-2', className)}>
      <Input
        {...field}
        {...inputProps}
        label={label}
        description={description}
        required={required}
        error={error?.message}
        aria-invalid={error ? 'true' : 'false'}
      />
    </div>
  );
}

// Textarea FormField
export interface FormTextareaProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends FormFieldProps<TFieldValues, TName>,
    Omit<TextareaProps, 'name' | 'error' | 'required' | 'label' | 'description'> {}

export function FormTextarea<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  label,
  description,
  required,
  className,
  ...textareaProps
}: FormTextareaProps<TFieldValues, TName>) {
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  return (
    <div className={cn('space-y-2', className)}>
      <Textarea
        {...field}
        {...textareaProps}
        label={label}
        description={description}
        required={required}
        error={error?.message}
        aria-invalid={error ? 'true' : 'false'}
      />
    </div>
  );
}

// Select FormField
export interface FormSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends FormFieldProps<TFieldValues, TName> {
  placeholder?: string;
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  disabled?: boolean;
}

export function FormSelect<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  label,
  description,
  required,
  className,
  placeholder = '選択してください',
  options,
  disabled,
}: FormSelectProps<TFieldValues, TName>) {
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  const selectId = React.useId();
  const errorId = `${selectId}-error`;
  const descriptionId = `${selectId}-description`;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <select
        {...field}
        id={selectId}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus:ring-destructive'
        )}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={cn(
          description && descriptionId,
          error && errorId
        )}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

      {description && !error && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}

// Checkbox FormField
export interface FormCheckboxProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends FormFieldProps<TFieldValues, TName> {
  disabled?: boolean;
}

export function FormCheckbox<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  label,
  description,
  required,
  className,
  disabled,
}: FormCheckboxProps<TFieldValues, TName>) {
  const {
    field: { value, onChange, ...field },
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  const checkboxId = React.useId();
  const errorId = `${checkboxId}-error`;
  const descriptionId = `${checkboxId}-description`;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center space-x-2">
        <input
          {...field}
          type="checkbox"
          id={checkboxId}
          checked={value || false}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className={cn(
            'h-4 w-4 rounded border border-input',
            'text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive'
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(
            description && descriptionId,
            error && errorId
          )}
        />
        {label && (
          <label
            htmlFor={checkboxId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
      </div>

      {description && !error && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
}