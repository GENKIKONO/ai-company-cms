/**
 * P1-2 Enum Migration対応 - Interview Session Form
 * 
 * Feature Flag統合によりenum/text値の安全な切り替えをサポート
 */

'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEnumMigration } from '@/lib/utils/feature-flags'
import { InterviewSessionService } from '@/lib/utils/enum-migration-helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

// P1-2: 型安全なフォームスキーマ（enum値対応）
const InterviewSessionFormSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(200, 'タイトルは200文字以内で入力してください'),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled', 'failed']),
  content_type: z.enum(['text', 'video', 'audio', 'structured'])
})

type InterviewSessionFormData = z.infer<typeof InterviewSessionFormSchema>

interface InterviewSessionFormProps {
  initialData?: Partial<InterviewSessionFormData>
  onSubmit: (data: InterviewSessionFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  userId?: string
  organizationId?: string
}

export default function InterviewSessionForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  userId,
  organizationId
}: InterviewSessionFormProps) {
  const [submitting, setSubmitting] = useState(false)
  
  // P1-2: Feature Flag状態監視
  const { shouldUseEnum: statusEnum, loading: statusLoading } = useEnumMigration(
    'ai_interview_sessions', 
    'status',
    { userId, organizationId }
  )
  
  const { shouldUseEnum: contentTypeEnum, loading: contentTypeLoading } = useEnumMigration(
    'ai_interview_sessions',
    'content_type', 
    { userId, organizationId }
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<InterviewSessionFormData>({
    resolver: zodResolver(InterviewSessionFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      status: initialData?.status || 'pending',
      content_type: initialData?.content_type || 'text'
    }
  })

  const watchedStatus = watch('status')
  const watchedContentType = watch('content_type')

  const handleFormSubmit = async (data: InterviewSessionFormData) => {
    if (submitting) return

    setSubmitting(true)
    try {
      // P1-2: Feature Flag対応での安全な値変換
      const sessionService = new InterviewSessionService({ userId, organizationId })
      
      // enum移行中の場合は、サービスクラスで適切な形式に変換
      const processedData = {
        ...data,
        // 実際の送信時はAPIルートで再度変換されるが、
        // フロントエンド側でも型安全性を保証
        status: await sessionService.readStatus(data.status),
        content_type: await sessionService.readContentType(data.content_type)
      }

      await onSubmit(processedData)
      toast.success('インタビューセッションが保存されました')
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Form submission error:', error)
      toast.error('保存中にエラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  // P1-2: Feature Flag loading中のUI
  if (statusLoading || contentTypeLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">設定を読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Title Field */}
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          タイトル <span className="text-red-500">*</span>
        </label>
        <Input
          id="title"
          type="text"
          {...register('title')}
          disabled={isLoading || submitting}
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && (
          <p className="text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          説明
        </label>
        <Textarea
          id="description"
          {...register('description')}
          disabled={isLoading || submitting}
          rows={3}
          className="resize-none"
        />
      </div>

      {/* Status Field - P1-2 enum対応 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          ステータス <span className="text-red-500">*</span>
          {statusEnum && (
            <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              Enum有効
            </span>
          )}
        </label>
        <Select
          value={watchedStatus}
          onValueChange={(value) => setValue('status', value as any)}
          disabled={isLoading || submitting}
        >
          <SelectTrigger>
            <SelectValue placeholder="ステータスを選択してください" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">準備中</SelectItem>
            <SelectItem value="in_progress">進行中</SelectItem>
            <SelectItem value="completed">完了</SelectItem>
            <SelectItem value="cancelled">キャンセル</SelectItem>
            <SelectItem value="failed">失敗</SelectItem>
          </SelectContent>
        </Select>
        {errors.status && (
          <p className="text-sm text-red-600">{errors.status.message}</p>
        )}
      </div>

      {/* Content Type Field - P1-2 enum対応 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          コンテンツタイプ <span className="text-red-500">*</span>
          {contentTypeEnum && (
            <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              Enum有効
            </span>
          )}
        </label>
        <Select
          value={watchedContentType}
          onValueChange={(value) => setValue('content_type', value as any)}
          disabled={isLoading || submitting}
        >
          <SelectTrigger>
            <SelectValue placeholder="コンテンツタイプを選択してください" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">テキスト</SelectItem>
            <SelectItem value="video">動画</SelectItem>
            <SelectItem value="audio">音声</SelectItem>
            <SelectItem value="structured">構造化</SelectItem>
          </SelectContent>
        </Select>
        {errors.content_type && (
          <p className="text-sm text-red-600">{errors.content_type.message}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6">
        <Button
          type="submit"
          disabled={isLoading || submitting}
          className="flex-1"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              保存中...
            </>
          ) : (
            '保存'
          )}
        </Button>
        
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading || submitting}
          >
            キャンセル
          </Button>
        )}
      </div>

      {/* P1-2: Feature Flag状態表示（開発時のみ） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Feature Flag Status (Dev)</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Status enum: {statusEnum ? '有効' : '無効'}</div>
            <div>Content type enum: {contentTypeEnum ? '有効' : '無効'}</div>
            <div>User ID: {userId || 'なし'}</div>
            <div>Organization ID: {organizationId || 'なし'}</div>
          </div>
        </div>
      )}
    </form>
  )
}