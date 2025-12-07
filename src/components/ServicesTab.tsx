'use client';

import { useState, useEffect , useCallback} from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import ServiceImageUploader from '@/components/ServiceImageUploader';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  duration: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

interface ServiceFormData {
  name: string;
  description: string;
  price: number | null;
  duration: string;
  category: string;
  image_url?: string;
}

interface ServicesTabProps {
  organizationId: string;
}

export default function ServicesTab({ organizationId }: ServicesTabProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);

  // Auto-clear errors after 10 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    price: null,
    duration: '',
    category: '',
    image_url: ''
  });

  const fetchServices = useCallback(async () => {
    try {
      setError(''); // Clear previous errors
      const response = await fetch(`/api/my/services?organizationId=${organizationId}`);
      if (response.ok) {
        const result = await response.json();
        setServices(result.data || []);
        setRetryCount(0); // Reset retry count on success
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          setError('認証エラーです。再度ログインしてください。');
        } else if (response.status === 404) {
          setError('組織情報が見つかりません。');
        } else if (response.status === 403) {
          setError('組織にアクセスする権限がありません。組織の作成者のみが操作できます。');
        } else {
          setError(errorData.message || errorData.error || 'サービス一覧の取得に失敗しました');
        }
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('ネットワークエラーが発生しました。接続を確認してください。');
      } else {
        setError('サービス一覧の取得に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: null,
      duration: '',
      category: '',
      image_url: ''
    });
    setEditingService(null);
    setShowForm(false);
    setError('');
  };

  const handleEdit = (service: Service) => {
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price,
      duration: service.duration || '',
      category: service.category || '',
      image_url: (service as any).image_url || ''
    });
    setEditingService(service);
    setShowForm(true);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('サービス名は必須です');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const url = editingService 
        ? `/api/my/services/${editingService.id}`
        : '/api/my/services';
      
      const method = editingService ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, organizationId }),
      });

      if (response.ok) {
        await fetchServices();
        resetForm();
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          setError('認証エラーです。再度ログインしてください。');
        } else if (response.status === 404) {
          setError('組織またはサービスが見つかりません。');
        } else if (response.status === 403) {
          setError('組織にアクセスする権限がありません。組織の作成者のみが操作できます。');
        } else {
          setError(errorData.error || errorData.message || 'サービスの保存に失敗しました');
        }
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('ネットワークエラーが発生しました。接続を確認してください。');
      } else {
        setError('サービスの保存に失敗しました');
      }
    } finally {
      setSubmitting(false);
    }
  }, [organizationId, editingService, fetchServices, formData]);

  const handleDelete = useCallback(async (serviceId: string) => {
    if (!confirm('このサービスを削除してもよろしいですか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/my/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchServices();
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          setError('認証エラーです。再度ログインしてください。');
        } else if (response.status === 404) {
          setError('削除対象のサービスが見つかりません。');
        } else if (response.status === 403) {
          setError('組織にアクセスする権限がありません。組織の作成者のみが削除できます。');
        } else {
          setError(errorData.error || errorData.message || 'サービスの削除に失敗しました');
        }
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('ネットワークエラーが発生しました。接続を確認してください。');
      } else {
        setError('サービスの削除に失敗しました');
      }
    }
  }, [fetchServices]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--aio-primary)] mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">サービス管理</h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-[var(--aio-primary)] text-white rounded-md hover:bg-[var(--aio-primary-hover)]"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            新しいサービス
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-600">{error}</p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setRetryCount(prev => prev + 1);
                    fetchServices();
                  }}
                  className="text-sm text-red-700 hover:text-red-800 underline"
                >
                  再試行
                </button>
                <button
                  onClick={() => setError('')}
                  className="text-red-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* サービス一覧 */}
        {services.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            まだサービスが登録されていません
          </div>
        ) : (
          <div className="mobile-table-scroll">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    サービス名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    カテゴリ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    価格
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    期間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((service) => (
                  <tr key={service.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{service.name}</div>
                        {service.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {service.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {service.category || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {service.price ? `¥${service.price.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {service.duration || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(service)}
                        className="text-[var(--aio-primary)] hover:text-blue-900 mr-4"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* サービス作成・編集フォーム */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-screen overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingService ? 'サービス編集' : '新しいサービス'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    サービス名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    説明
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    カテゴリ
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    価格（円）
                  </label>
                  <input
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    期間・時間
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="例: 1時間、3ヶ月など"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                  />
                </div>

                <div>
                  <ServiceImageUploader
                    serviceId={editingService?.id}
                    currentImageUrl={formData.image_url}
                    onImageChange={(imageUrl) => setFormData(prev => ({ ...prev, image_url: imageUrl || '' }))}
                    disabled={submitting}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-[var(--aio-primary)] text-white rounded-md hover:bg-[var(--aio-primary-hover)] disabled:opacity-50"
                  >
                    {submitting ? '保存中...' : '保存'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}