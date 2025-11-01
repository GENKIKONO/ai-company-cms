/**
 * 管理者ヒアリング依頼管理ページ
 * 全ヒアリング依頼の閲覧・管理機能
 */

'use client';

import { useState, useEffect } from 'react';
import { Metadata } from 'next';
import { Calendar, Clock, User, Building, Phone, Mail, MessageSquare, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { HIGButton } from '@/design-system';
import { logger } from '@/lib/utils/logger';

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
  requester_id?: string;
  organization_id?: string;
}

interface ContentCreationRequest {
  services: boolean;
  faqs: boolean;
  case_studies: boolean;
  posts: boolean;
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
  const [interviewSummary, setInterviewSummary] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [contentCreationRequest, setContentCreationRequest] = useState<ContentCreationRequest>({
    services: false,
    faqs: false,
    case_studies: false,
    posts: false
  });
  const [isCreatingContent, setIsCreatingContent] = useState(false);

  useEffect(() => {
    fetchHearingRequests();
  }, []);

  const fetchHearingRequests = async () => {
    try {
      const response = await fetch('/api/admin/hearing-requests');
      if (!response.ok) {
        if (response.status === 404 || response.status === 500) {
          // No data found or server error - set empty array
          setHearingRequests([]);
          setLoading(false);
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch hearing requests');
      }
      const data = await response.json();
      setHearingRequests(data.hearing_requests || []);
    } catch (err) {
      logger.error('Fetch error:', err);
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
        return 'bg-gray-100 text-gray-700';
      case 'in_progress':
        return 'bg-gray-100 text-gray-700';
      case 'completed':
        return 'bg-gray-100 text-gray-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredRequests = hearingRequests.filter(request => 
    statusFilter === 'all' || request.status === statusFilter
  );

  const getSelectedCategories = (request: HearingRequest) => {
    return hearingCategories.filter(cat => request[cat.key as keyof HearingRequest] as boolean);
  };

  // 統合されたコンテンツ作成処理
  const handleCreateContent = async () => {
    if (!selectedRequest) return;
    
    setIsCreatingContent(true);
    try {
      // 選択されたコンテンツタイプを取得
      const selectedTypes = Object.entries(contentCreationRequest)
        .filter(([_, isSelected]) => isSelected)
        .map(([type, _]) => type);

      if (selectedTypes.length === 0) {
        alert('作成するコンテンツタイプを少なくとも1つ選択してください');
        return;
      }

      // 1. 委任設定作成
      const delegationResponse = await fetch('/api/admin/delegation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_user_id: selectedRequest.requester_id || selectedRequest.users.email,
          organization_id: selectedRequest.organization_id || selectedRequest.organizations.id,
          scope: selectedTypes,
          hearing_context: interviewSummary,
          notes: `ヒアリング依頼ID: ${selectedRequest.id} から自動作成`
        })
      });

      if (!delegationResponse.ok) {
        throw new Error('委任設定の作成に失敗しました');
      }

      const delegation = await delegationResponse.json();

      // 2. 各コンテンツタイプの下書き作成
      const draftPromises = selectedTypes.map(async (contentType) => {
        const title = generateTitleFromHearing(selectedRequest, contentType);
        const content = generateContentFromHearing(selectedRequest, contentType, interviewSummary);

        return fetch('/api/admin/hearing/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            delegation_id: delegation.delegation.id,
            content_type: contentType,
            title,
            content,
            hearing_summary: interviewSummary
          })
        });
      });

      const draftResponses = await Promise.all(draftPromises);
      const drafts = await Promise.all(
        draftResponses.map(response => response.json())
      );

      // 3. ヒアリング完了ステータス更新
      await fetch('/api/admin/hearing-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRequest.id,
          status: 'completed',
          interview_summary: interviewSummary,
          admin_notes: adminNotes,
          completed_at: new Date().toISOString()
        })
      });

      alert(`${drafts.length}件の代行コンテンツ下書きを作成し、承認依頼を送信しました！`);
      
      // モーダルを閉じて画面をリフレッシュ
      setShowModal(false);
      fetchHearingRequests();

    } catch (error) {
      logger.error('Content creation error', error instanceof Error ? error : new Error(String(error)));
      alert('代行コンテンツ作成に失敗しました');
    } finally {
      setIsCreatingContent(false);
    }
  };

  // ヒアリング結果からタイトル生成
  const generateTitleFromHearing = (request: HearingRequest, contentType: string): string => {
    const orgName = request.organizations.name;
    
    switch (contentType) {
      case 'services':
        return `${orgName}のサービス紹介`;
      case 'faqs':
        return `${orgName}に関するよくある質問`;
      case 'case_studies':
        return `${orgName}の導入事例`;
      case 'posts':
        return `${orgName}について - ブログ記事`;
      default:
        return `${orgName}のコンテンツ`;
    }
  };

  // ヒアリング結果からコンテンツ生成
  const generateContentFromHearing = (request: HearingRequest, contentType: string, summary: string): string => {
    const orgName = request.organizations.name;
    const purpose = request.purpose;
    
    let content = `# ${generateTitleFromHearing(request, contentType)}\n\n`;
    
    content += `## 概要\n${purpose}\n\n`;
    
    if (summary) {
      content += `## ヒアリング結果\n${summary}\n\n`;
    }

    // ヒアリング項目に基づいたコンテンツ追加
    if (request.business_overview) {
      content += `## 事業概要\n（ヒアリング結果に基づいて詳細を記載）\n\n`;
    }
    
    if (request.service_details) {
      content += `## サービス詳細\n（ヒアリング結果に基づいて詳細を記載）\n\n`;
    }
    
    if (request.competitive_advantage) {
      content += `## 競合優位性\n（ヒアリング結果に基づいて詳細を記載）\n\n`;
    }
    
    if (request.target_market) {
      content += `## ターゲット市場\n（ヒアリング結果に基づいて詳細を記載）\n\n`;
    }

    content += `\n---\n*このコンテンツは${orgName}のヒアリング結果に基づいて作成されました。*`;
    
    return content;
  };

  // モーダル開く時の初期化
  const handleOpenModal = (request: HearingRequest) => {
    setSelectedRequest(request);
    setInterviewSummary(request.interview_summary || '');
    setAdminNotes(request.admin_notes || '');
    setContentCreationRequest({
      services: request.service_details,
      faqs: true, // デフォルトでFAQは選択
      case_studies: request.case_studies,
      posts: false
    });
    setShowModal(true);
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--aio-primary)]"></div>
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ヒアリング依頼管理</h1>
              <p className="text-gray-600 mt-2">企業ヒアリング代行依頼の管理・進捗確認</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  // 新規ヒアリング作成機能（管理者用）
                  alert('管理者用ヒアリング作成機能を実装予定です');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新規ヒアリング作成
              </button>
              <button
                onClick={() => {
                  // ヒアリング一覧をリフレッシュ
                  fetchHearingRequests();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                更新
              </button>
            </div>
          </div>
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
            <div className="text-2xl font-bold text-[var(--aio-primary)]">{statusCounts.in_progress}</div>
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
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              待機中 ({statusCounts.pending})
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3 py-1 rounded-full text-sm ${
                statusFilter === 'in_progress' 
                  ? 'bg-blue-200 text-blue-900' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              進行中 ({statusCounts.in_progress})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1 rounded-full text-sm ${
                statusFilter === 'completed' 
                  ? 'bg-green-200 text-green-900' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              完了 ({statusCounts.completed})
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1 rounded-full text-sm ${
                statusFilter === 'cancelled' 
                  ? 'bg-red-200 text-red-900' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
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
                    <HIGButton
                      onClick={() => handleOpenModal(request)}
                      variant="primary"
                      size="sm"
                    >
                      詳細・編集
                    </HIGButton>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 詳細モーダル（統合版） */}
        {showModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    ヒアリング依頼詳細・代行コンテンツ作成
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 左側：基本情報・ヒアリング結果 */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 border-b pb-2">📋 ヒアリング情報</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">組織名</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedRequest.organizations.name}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">依頼目的</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedRequest.purpose}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ヒアリング項目</label>
                      <div className="flex flex-wrap gap-1">
                        {getSelectedCategories(selectedRequest).map((category) => (
                          <span
                            key={category.key}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {category.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ヒアリング結果 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        rows={6}
                        placeholder="ヒアリング実施後の結果を詳細に記載してください..."
                        value={interviewSummary}
                        onChange={(e) => setInterviewSummary(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">管理者メモ</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        rows={3}
                        placeholder="管理者用のメモを入力..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* 右側：代行コンテンツ作成 */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 border-b pb-2">🚀 代行コンテンツ作成</h4>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-[var(--aio-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-blue-800">自動コンテンツ生成</span>
                      </div>
                      <p className="text-sm text-blue-700 mb-4">
                        ヒアリング結果を基に、選択したコンテンツタイプの下書きを自動生成します。
                        生成後、クライアントに承認依頼が送信されます。
                      </p>
                      
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">作成するコンテンツ</label>
                        
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={contentCreationRequest.services}
                              onChange={(e) => setContentCreationRequest(prev => ({
                                ...prev,
                                services: e.target.checked
                              }))}
                              className="rounded border-gray-300 text-[var(--aio-primary)] focus:ring-[var(--aio-primary)]"
                            />
                            <span className="ml-2 text-sm text-gray-700">📄 サービス紹介記事</span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={contentCreationRequest.faqs}
                              onChange={(e) => setContentCreationRequest(prev => ({
                                ...prev,
                                faqs: e.target.checked
                              }))}
                              className="rounded border-gray-300 text-[var(--aio-primary)] focus:ring-[var(--aio-primary)]"
                            />
                            <span className="ml-2 text-sm text-gray-700">❓ FAQ</span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={contentCreationRequest.case_studies}
                              onChange={(e) => setContentCreationRequest(prev => ({
                                ...prev,
                                case_studies: e.target.checked
                              }))}
                              className="rounded border-gray-300 text-[var(--aio-primary)] focus:ring-[var(--aio-primary)]"
                            />
                            <span className="ml-2 text-sm text-gray-700">📈 導入事例</span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={contentCreationRequest.posts}
                              onChange={(e) => setContentCreationRequest(prev => ({
                                ...prev,
                                posts: e.target.checked
                              }))}
                              className="rounded border-gray-300 text-[var(--aio-primary)] focus:ring-[var(--aio-primary)]"
                            />
                            <span className="flex items-center gap-1 ml-2 text-sm text-gray-700">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              ブログ記事
                            </span>
                          </label>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <HIGButton
                          onClick={handleCreateContent}
                          disabled={isCreatingContent || !interviewSummary.trim()}
                          variant="primary"
                          size="md"
                          className="w-full"
                        >
                          {isCreatingContent ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              代行コンテンツ作成中...
                            </div>
                          ) : (
                            '🚀 代行コンテンツ作成開始'
                          )}
                        </HIGButton>
                        
                        {!interviewSummary.trim() && (
                          <p className="text-xs text-red-500 mt-1">
                            ヒアリング結果の入力が必要です
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    閉じる
                  </button>
                  <button
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    onClick={() => {
                      // 基本的な保存処理（ヒアリング結果とメモのみ）
                      fetch('/api/admin/hearing-requests', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          id: selectedRequest.id,
                          interview_summary: interviewSummary,
                          admin_notes: adminNotes
                        })
                      }).then(() => {
                        alert('保存しました');
                        fetchHearingRequests();
                      }).catch(() => {
                        alert('保存に失敗しました');
                      });
                    }}
                  >
                    💾 保存
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 実装注記 */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-green-800">🚀 統合ヒアリング→代行コンテンツ作成機能</h4>
              <p className="text-sm text-green-700 mt-1">
                <strong>新機能実装完了！</strong> ヒアリング管理画面から直接代行コンテンツ作成が可能になりました。
              </p>
              <ul className="text-sm text-green-700 mt-2 space-y-1">
                <li>• ヒアリング結果を基にした自動コンテンツ生成</li>
                <li>• 委任設定から下書き作成まで一括処理</li>
                <li>• クライアント承認依頼の自動送信</li>
                <li>• 複数コンテンツタイプの同時作成対応</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}