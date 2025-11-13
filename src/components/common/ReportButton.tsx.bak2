'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { logger } from '@/lib/utils/logger';

interface ReportButtonProps {
  organizationId: string;
  organizationName: string;
  className?: string;
}

export default function ReportButton({ organizationId, organizationName, className = '' }: ReportButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reportTypes = [
    { value: 'inappropriate_content', label: '不適切なコンテンツ' },
    { value: 'fake_information', label: '虚偽の情報' },
    { value: 'spam', label: 'スパム・宣伝' },
    { value: 'copyright_violation', label: '著作権侵害' },
    { value: 'harassment', label: 'ハラスメント' },
    { value: 'other', label: 'その他' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reportType || !description.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/public/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: organizationId,
          report_type: reportType,
          description: description.trim(),
          reported_url: window.location.href,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setShowModal(false);
          setSubmitted(false);
          setReportType('');
          setDescription('');
        }, 2000);
      } else {
        alert('通報の送信に失敗しました。しばらく後に再度お試しください。');
      }
    } catch (error) {
      logger.error('Report submission error', error instanceof Error ? error : new Error(String(error)));
      alert('通報の送信中にエラーが発生しました。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`hit-44 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors ${className}`}
        title="不適切なコンテンツを通報"
      >
        <AlertTriangle size={16} />
        <span>通報</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  コンテンツを通報
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={submitting}
                >
                  <X size={20} />
                </button>
              </div>

              {submitted ? (
                <div className="text-center py-8">
                  <div className="text-green-600 text-lg mb-2">✓</div>
                  <p className="text-gray-900 font-medium">通報を受け付けました</p>
                  <p className="text-gray-600 text-sm mt-1">
                    ご報告いただきありがとうございます。<br />
                    運営チームが確認いたします。
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-4">
                      「{organizationName}」について不適切なコンテンツを報告してください。
                    </p>
                    
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      通報理由 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    >
                      <option value="">選択してください</option>
                      {reportTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      詳細説明 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="具体的な問題の内容をご記入ください"
                      required
                      maxLength={1000}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {description.length}/1000文字
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="hit-44 flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors btn-nowrap"
                      disabled={submitting}
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="hit-44 flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 btn-nowrap"
                      disabled={submitting || !reportType || !description.trim()}
                    >
                      {submitting ? '送信中...' : '通報する'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}