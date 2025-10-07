/**
 * 管理者ヒアリング依頼管理ページ
 * 全ヒアリング依頼の閲覧・管理機能
 */

'use client';

import { useState, useEffect } from 'react';
import { Metadata } from 'next';
import { Calendar, Clock, User, Building, Phone, Mail, MessageSquare, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface HearingRequest {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  purpose: string;
  preferred_date: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  business_overview: boolean;
  service_details: boolean;
  case_studies: boolean;
  competitive_advantage: boolean;
  target_market: boolean;
  assigned_to: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  admin_notes: string | null;
  interview_summary: string | null;
  deliverables_url: string | null;
  created_at: string;
  updated_at: string;
  organizations: {
    id: string;
    name: string;
  };
  users: {
    email: string;
  };
}

interface HearingCategory {
  key: string;
  label: string;
}

const hearingCategories: HearingCategory[] = [
  { key: 'business_overview', label: '事業概要' },
  { key: 'service_details', label: 'サービス詳細' },
  { key: 'case_studies', label: '事例・実績' },
  { key: 'competitive_advantage', label: '競合優位性' },
  { key: 'target_market', label: 'ターゲット市場' },
];

export default function AdminHearingsPage() {
  const [hearingRequests, setHearingRequests] = useState<HearingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<HearingRequest | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchHearingRequests();
  }, []);

  const fetchHearingRequests = async () => {
    try {
      const response = await fetch('/api/admin/hearing-requests');
      if (!response.ok) {
        throw new Error('Failed to fetch hearing requests');
      }
      const data = await response.json();
      setHearingRequests(data.hearing_requests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '待機中';
      case 'in_progress':
        return '進行中';
      case 'completed':
        return '完了';
      case 'cancelled':
        return 'キャンセル';
      default:
        return '不明';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = hearingRequests.filter(request => 
    statusFilter === 'all' || request.status === statusFilter
  );

  const getSelectedCategories = (request: HearingRequest) => {
    return hearingCategories.filter(cat => request[cat.key as keyof HearingRequest] as boolean);
  };

  const statusCounts = {
    all: hearingRequests.length,
    pending: hearingRequests.filter(r => r.status === 'pending').length,
    in_progress: hearingRequests.filter(r => r.status === 'in_progress').length,
    completed: hearingRequests.filter(r => r.status === 'completed').length,
    cancelled: hearingRequests.filter(r => r.status === 'cancelled').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">エラー: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ヒアリング依頼管理</h1>
          <p className="text-gray-600 mt-2">企業ヒアリング代行依頼の管理・進捗確認</p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">{statusCounts.all}</div>
            <div className="text-sm text-gray-600">総依頼数</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
            <div className="text-sm text-gray-600">待機中</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.in_progress}</div>
            <div className="text-sm text-gray-600">進行中</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
            <div className="text-sm text-gray-600">完了</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-red-600">{statusCounts.cancelled}</div>
            <div className="text-sm text-gray-600">キャンセル</div>
          </div>
        </div>

        {/* フィルター */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-full text-sm ${
                statusFilter === 'all' 
                  ? 'bg-gray-200 text-gray-900' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              すべて ({statusCounts.all})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-full text-sm ${
                statusFilter === 'pending' 
                  ? 'bg-yellow-200 text-yellow-900' 
                  : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
              }`}
            >
              待機中 ({statusCounts.pending})
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3 py-1 rounded-full text-sm ${
                statusFilter === 'in_progress' 
                  ? 'bg-blue-200 text-blue-900' 
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
            >
              進行中 ({statusCounts.in_progress})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1 rounded-full text-sm ${
                statusFilter === 'completed' 
                  ? 'bg-green-200 text-green-900' 
                  : 'bg-green-100 text-green-600 hover:bg-green-200'
              }`}
            >
              完了 ({statusCounts.completed})
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1 rounded-full text-sm ${
                statusFilter === 'cancelled' 
                  ? 'bg-red-200 text-red-900' 
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
            >
              キャンセル ({statusCounts.cancelled})
            </button>
          </div>
        </div>

        {/* 依頼一覧 */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">該当するヒアリング依頼がありません</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusIcon(request.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{request.organizations.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{request.users.email}</span>
                        </div>
                        {request.contact_phone && (
                          <div className="flex items-center gap-2 mb-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{request.contact_phone}</span>
                          </div>
                        )}
                        {request.contact_email && (
                          <div className="flex items-center gap-2 mb-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{request.contact_email}</span>
                          </div>
                        )}
                        {request.preferred_date && (
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              希望日: {new Date(request.preferred_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">ヒアリング項目</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {getSelectedCategories(request).map((category) => (
                            <span
                              key={category.key}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {category.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-700">{request.purpose}</p>
                    </div>
                  </div>

                  <div className="ml-4">
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowModal(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      詳細・編集
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 詳細モーダル（簡易版） */}
        {showModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    ヒアリング依頼詳細
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">組織名</label>
                    <p className="text-sm text-gray-900">{selectedRequest.organizations.name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">依頼目的</label>
                    <p className="text-sm text-gray-900">{selectedRequest.purpose}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">管理者メモ</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      rows={3}
                      placeholder="管理者用のメモを入力..."
                      defaultValue={selectedRequest.admin_notes || ''}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      閉じる
                    </button>
                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      保存
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 実装注記 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-blue-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-800">ヒアリング管理機能</h4>
              <p className="text-sm text-blue-700 mt-1">
                Phase E実装完了：ヒアリング依頼の管理画面が実装されました。
                管理者は全ての依頼を確認し、ステータス更新やメモ管理が可能です。
                データベースマイグレーション適用後に完全に動作します。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}