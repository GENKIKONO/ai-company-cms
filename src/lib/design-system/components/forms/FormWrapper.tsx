/**
 * FormWrapper コンポーネント
 * 要件定義準拠: フォーム体験最適化、エラーハンドリング統一
 */

import React from 'react';
import { 
  useForm, 
  FormProvider, 
  UseFormReturn, 
  FieldValues,
  DefaultValues,
  Resolver 
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useToast } from '../ui/Toast';

export interface FormWrapperProps<TFieldValues extends FieldValues> {
  children: React.ReactNode;
  onSubmit: (data: TFieldValues) => Promise<void> | void;
  schema?: z.ZodType<TFieldValues>;
  defaultValues?: DefaultValues<TFieldValues>;
  title?: string;
  description?: string;
  submitLabel?: string;
  submitVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  resetOnSuccess?: boolean;
  showCard?: boolean;
  className?: string;
  disabled?: boolean;
  form?: UseFormReturn<TFieldValues>;
}

export function FormWrapper<TFieldValues extends FieldValues = FieldValues>({
  children,
  onSubmit,
  schema,
  defaultValues,
  title,
  description,
  submitLabel = '保存',
  submitVariant = 'default',
  resetOnSuccess = false,
  showCard = true,
  className,
  disabled = false,
  form: externalForm,
}: FormWrapperProps<TFieldValues>) {
  const { toast } = useToast();
  
  // Use external form if provided, otherwise create internal form
  const internalForm = useForm<TFieldValues>({
    resolver: schema ? zodResolver(schema as any) : undefined,
    defaultValues,
  });
  
  const form = externalForm || internalForm;
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (data: TFieldValues) => {
    if (disabled || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      await onSubmit(data);
      
      if (resetOnSuccess) {
        form.reset();
      }
      
      toast({
        variant: 'success',
        title: '保存完了',
        description: 'データが正常に保存されました。',
      });
    } catch (error) {
      console.error('Form submission error:', error);
      
      toast({
        variant: 'error',
        title: '保存エラー',
        description: error instanceof Error 
          ? error.message 
          : 'データの保存に失敗しました。',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <FormProvider {...form}>
      <form 
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn('space-y-6', className)}
        noValidate
      >
        {children}
        
        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="submit"
            variant={submitVariant}
            loading={isSubmitting}
            disabled={disabled || isSubmitting || !form.formState.isValid}
            className="min-w-[100px]"
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </FormProvider>
  );

  if (!showCard) {
    return formContent;
  }

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
      )}
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}

// Hook for form state management
export function useFormWrapper<TFieldValues extends FieldValues>(
  schema?: z.ZodType<TFieldValues>,
  defaultValues?: DefaultValues<TFieldValues>
) {
  return useForm<TFieldValues>({
    resolver: schema ? zodResolver(schema as any) : undefined,
    defaultValues,
    mode: 'onChange', // Real-time validation
  });
}

// Form Section Component for multi-step forms
export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ 
  title, 
  description, 
  children, 
  className 
}: FormSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="border-b pb-4">
        <h3 className="text-lg font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// Form Actions Component
export interface FormActionsProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export function FormActions({ 
  children, 
  align = 'right', 
  className 
}: FormActionsProps) {
  return (
    <div
      className={cn(
        'flex space-x-4 pt-4 border-t',
        {
          'justify-start': align === 'left',
          'justify-center': align === 'center',
          'justify-end': align === 'right',
        },
        className
      )}
    >
      {children}
    </div>
  );
}