'use client';

import { useState } from 'react';
import { faqSchema } from '@/lib/validation';

interface FAQData {
  id?: string;
  question: string;
  answer: string;
  sort_order: number;
}

interface FAQFormProps {
  initialData?: FAQData;
  onSubmit: (data: FAQData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  maxSortOrder?: number;
}

export default function FAQForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  maxSortOrder = 0
}: FAQFormProps) {
  const [formData, setFormData] = useState<FAQData>({
    question: '',
    answer: '',
    sort_order: maxSortOrder + 1,
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // バリデーション
      const validationResult = faqSchema.safeParse(formData);

      if (!validationResult.success) {
        const validationErrors: Record<string, string> = {};
        validationResult.error.errors.forEach((error) => {
          const field = error.path.join('.');
          validationErrors[field] = error.message;
        });
        setErrors(validationErrors);
        return;
      }

      setErrors({});
      await onSubmit(formData);
    } catch (error) {
      console.error('FAQ form submission error:', error);
      setErrors({ submit: 'FAQの保存に失敗しました' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-6">
      <div className="space-y-6">
        {/* エラー表示 */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* 表示順序 */}
        <div>
          <label htmlFor="sort_order" className="block text-sm font-medium text-gray-700 mb-2">
            表示順序
          </label>
          <input
            type="number"
            id="sort_order"
            min="1"
            value={formData.sort_order}
            onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 1 }))}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            数値が小さいほど上位に表示されます
          </p>
          {errors.sort_order && <p className="mt-1 text-sm text-red-600">{errors.sort_order}</p>}
        </div>

        {/* 質問 */}
        <div>
          <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
            質問 *
          </label>
          <input
            type="text"
            id="question"
            value={formData.question}
            onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="例: 料金体系について教えてください"
          />
          <p className="mt-1 text-sm text-gray-500">
            {formData.question.length} / 200文字
          </p>
          {errors.question && <p className="mt-1 text-sm text-red-600">{errors.question}</p>}
        </div>

        {/* 回答 */}
        <div>
          <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
            回答 *
          </label>
          <textarea
            id="answer"
            rows={6}
            value={formData.answer}
            onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="質問に対する詳細な回答を記載してください"
          />
          <p className="mt-1 text-sm text-gray-500">
            {formData.answer.length} / 1000文字
          </p>
          {errors.answer && <p className="mt-1 text-sm text-red-600">{errors.answer}</p>}
        </div>

        {/* プレビュー */}
        {formData.question && formData.answer && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">プレビュー</h3>
            <div className="space-y-2">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Q. {formData.question}</h4>
              </div>
              <div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">A. {formData.answer}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ボタン */}
      <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );
}