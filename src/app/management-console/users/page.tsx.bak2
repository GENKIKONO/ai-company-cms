'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  User, Building, Mail, Calendar, Shield, Edit, Trash2, Eye, Search, 
  FileText, Briefcase, HelpCircle, BookOpen, ExternalLink, 
  MoreVertical, Play, Pause, Archive, AlertTriangle, Plus, X, CreditCard, Star
} from 'lucide-react';
import { HIGButton } from '@/design-system';
import { logger } from '@/lib/utils/logger';

interface UserData {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  organizations?: {
    id: string;
    name: string;
    industry?: string;
  };
}

interface UserDetails {
  user: {
    id: string;
    email: string;
    role: 'admin' | 'user';
    created_at: string;
    updated_at: string;
    last_sign_in_at?: string;
    email_confirmed_at?: string;
  };
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    is_published: boolean;
    created_at: string;
    updated_at: string;
    description?: string;
    url?: string;
    email?: string;
    telephone?: string;
    address_country?: string;
    address_region?: string;
    address_locality?: string;
    plan?: string;
    admin_plan_override?: boolean;
    admin_plan_notes?: string;
    admin_plan_changed_by?: string;
    admin_plan_changed_at?: string;
    trial_expires_at?: string;
  }>;
  content: {
    services: Array<{
      id: string;
      name: string;
      description?: string;
      status: string;
      is_published: boolean;
      created_at: string;
      updated_at: string;
      organization_id: string;
    }>;
    posts: Array<{
      id: string;
      title: string;
      status: string;
      is_published: boolean;
      created_at: string;
      updated_at: string;
      organization_id: string;
    }>;
    caseStudies: Array<{
      id: string;
      title: string;
      status: string;
      is_published: boolean;
      created_at: string;
      updated_at: string;
      organization_id: string;
    }>;
    faqs: Array<{
      id: string;
      question: string;
      status: string;
      is_published: boolean;
      created_at: string;
      updated_at: string;
      organization_id: string;
    }>;
  };
  stats: {
    organizations: number;
    services: number;
    posts: number;
    caseStudies: number;
    faqs: number;
    totalContent: number;
    publishedContent: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'service' | 'post' | 'case_study' | 'faq';
    name?: string;
    title?: string;
    question?: string;
    status: string;
    is_published: boolean;
    updated_at: string;
  }>;
}

const roleLabels = {
  admin: '管理者',
  user: '一般ユーザー'
};

const roleColors = {
  admin: 'bg-red-100 text-red-800',
  user: 'bg-blue-100 text-blue-800'
};

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'service' | 'post' | 'faq' | 'case_study' | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', { cache: 'no-store' });
      
      // 原因別UI分岐（既存の文言・クラスを流用）
      if (response.status === 401) {
        setError('ログインが必要です。再ログインしてください。');
        setLoading(false);
        return;
      }
      
      if (response.status === 403) {
        setError('管理者権限が必要です');
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error === 'ENV_MISSING' 
          ? 'システム設定エラー（環境変数不足）'
          : errorData.message || 'ユーザーデータの取得に失敗しました';
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      logger.error('Fetch users error:', err);
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: newRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'ユーザー情報の更新に失敗しました');
      }

      await fetchUsers();
      setSelectedUser(null);
      setShowModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setUpdating(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('このユーザーを削除してもよろしいですか？この操作は取り消せません。')) {
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'ユーザーの削除に失敗しました');
      }

      await fetchUsers();
      setSelectedUser(null);
      setShowModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setUpdating(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/details`, { cache: 'no-store' });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'ユーザー詳細の取得に失敗しました');
      }
      
      const details = await response.json();
      setUserDetails(details);
    } catch (err) {
      logger.error('Fetch user details error:', err);
      alert(err instanceof Error ? err.message : 'ユーザー詳細の取得中にエラーが発生しました');
    } finally {
      setLoadingDetails(false);
    }
  };

  const executeContentAction = async (
    contentType: string, 
    contentId: string, 
    action: string, 
    reason?: string
  ) => {
    if (!selectedUser) return;

    const actionNames = {
      publish: '公開',
      unpublish: '非公開',
      suspend: '停止',
      delete: '削除'
    };

    if (!confirm(`このコンテンツを${actionNames[action as keyof typeof actionNames]}してもよろしいですか？`)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          contentType,
          contentId,
          reason
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'コンテンツ操作に失敗しました');
      }

      // 詳細情報を再取得
      await fetchUserDetails(selectedUser.id);
      alert(`コンテンツの${actionNames[action as keyof typeof actionNames]}が完了しました`);
    } catch (err) {
      logger.error('Content action error:', err);
      alert(err instanceof Error ? err.message : 'コンテンツ操作中にエラーが発生しました');
    } finally {
      setActionLoading(false);
    }
  };

  const createProxyContent = async (formData: any) => {
    if (!selectedUser || !createType) return;

    setCreateLoading(true);
    try {
      const endpoint = createType === 'case_study' ? 'case-studies' : `${createType}s`;
      const response = await fetch(`/api/admin/proxy/${selectedUser.id}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '作成に失敗しました');
      }

      // 詳細情報を再取得
      await fetchUserDetails(selectedUser.id);
      setShowCreateModal(false);
      setCreateType(null);
      alert('コンテンツが正常に作成されました');
    } catch (err) {
      logger.error('Proxy content creation error:', err);
      alert(err instanceof Error ? err.message : 'コンテンツ作成中にエラーが発生しました');
    } finally {
      setCreateLoading(false);
    }
  };

  const openCreateModal = (type: 'service' | 'post' | 'faq' | 'case_study') => {
    setCreateType(type);
    setShowCreateModal(true);
  };

  const changePlan = async (planData: any) => {
    if (!selectedUser) return;

    setPlanLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/plan`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'プラン変更に失敗しました');
      }

      // 詳細情報を再取得
      await fetchUserDetails(selectedUser.id);
      setShowPlanModal(false);
      alert('プランが正常に変更されました');
    } catch (err) {
      logger.error('Plan change error:', err);
      alert(err instanceof Error ? err.message : 'プラン変更中にエラーが発生しました');
    } finally {
      setPlanLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.organizations?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const userStats = {
    total: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    user: users.filter(u => u.role === 'user').length,
    verified: users.filter(u => u.email_confirmed_at).length,
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--aio-primary)]"></div>
          <span className="ml-3">読み込み中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={fetchUsers}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <nav className="flex mb-4">
          <Link href="/management-console" className="text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)]">
            管理コンソール
          </Link>
          <span className="mx-2 text-gray-500">/</span>
          <span className="text-gray-900">ユーザー管理</span>
        </nav>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ユーザー管理</h1>
        <p className="text-gray-600">
          システム利用者の管理・権限設定・削除
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{userStats.total}</div>
          <div className="text-sm text-gray-600">総ユーザー数</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">{userStats.admin}</div>
          <div className="text-sm text-gray-600">管理者</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-[var(--aio-primary)]">{userStats.user}</div>
          <div className="text-sm text-gray-600">一般ユーザー</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{userStats.verified}</div>
          <div className="text-sm text-gray-600">認証済み</div>
        </div>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="メールアドレスや組織名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full text-sm focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            {['all', 'admin', 'user'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  roleFilter === role
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {role === 'all' ? 'すべて' : roleLabels[role as keyof typeof roleLabels]}
                {role !== 'all' && (
                  <span className="ml-1">
                    ({users.filter(u => u.role === role).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ユーザー一覧 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ユーザーが見つかりません</h3>
            <p className="text-gray-500">
              {searchTerm || roleFilter !== 'all' 
                ? '検索条件に一致するユーザーがありません。' 
                : '現在、登録されているユーザーはありません。'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ユーザー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    組織
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    権限
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    登録日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最終ログイン
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.email}</div>
                          <div className="text-sm text-gray-500">
                            {user.email_confirmed_at ? (
                              <span className="text-green-600">認証済み</span>
                            ) : (
                              <span className="text-yellow-600">未認証</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.organizations?.name || '-'}
                      </div>
                      {user.organizations?.industry && (
                        <div className="text-sm text-gray-500">
                          {user.organizations.industry}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleColors[user.role]}`}>
                        <Shield className="h-3 w-3 mr-1" />
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.last_sign_in_at 
                        ? new Date(user.last_sign_in_at).toLocaleDateString()
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={async () => {
                          setSelectedUser(user);
                          setUserDetails(null);
                          setShowModal(true);
                          await fetchUserDetails(user.id);
                        }}
                        className="text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)] mr-3"
                      >
                        <Eye className="h-4 w-4 inline mr-1" />
                        詳細
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 拡張されたユーザー詳細モーダル */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  ユーザー詳細 - {selectedUser.email}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setUserDetails(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {loadingDetails ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--aio-primary)]"></div>
                  <span className="ml-3">詳細情報を読み込み中...</span>
                </div>
              ) : userDetails ? (
                <div className="space-y-6">
                  {/* ユーザー基本情報 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">基本情報</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">メールアドレス:</span>
                        <p className="text-gray-900">{userDetails.user.email}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">権限:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${roleColors[userDetails.user.role]}`}>
                          <Shield className="h-3 w-3 mr-1" />
                          {roleLabels[userDetails.user.role]}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">登録日:</span>
                        <p className="text-gray-900">{new Date(userDetails.user.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">最終ログイン:</span>
                        <p className="text-gray-900">
                          {userDetails.user.last_sign_in_at 
                            ? new Date(userDetails.user.last_sign_in_at).toLocaleDateString()
                            : 'ログイン履歴なし'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 統計情報 */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">コンテンツ統計</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[var(--aio-primary)]">{userDetails.stats.organizations}</div>
                        <div className="text-xs text-gray-600">組織</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{userDetails.stats.services}</div>
                        <div className="text-xs text-gray-600">サービス</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{userDetails.stats.posts}</div>
                        <div className="text-xs text-gray-600">投稿</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{userDetails.stats.faqs}</div>
                        <div className="text-xs text-gray-600">FAQ</div>
                      </div>
                    </div>
                    <div className="mt-3 text-center">
                      <span className="text-sm text-gray-600">
                        総コンテンツ: <strong>{userDetails.stats.totalContent}</strong> / 
                        公開中: <strong>{userDetails.stats.publishedContent}</strong>
                      </span>
                    </div>
                  </div>

                  {/* プラン管理 */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      プラン・機能設定
                    </h4>
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            現在のプラン: 
                            <span className="ml-2 px-3 py-1 bg-white border rounded-md font-semibold">
                              {userDetails.organizations[0]?.plan || 'free'}
                            </span>
                            {userDetails.organizations[0]?.admin_plan_override && (
                              <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                                <Star className="h-3 w-3 inline mr-1" />
                                管理者設定
                              </span>
                            )}
                          </span>
                        </div>
                        <HIGButton
                          onClick={() => setShowPlanModal(true)}
                          variant="primary"
                          size="sm"
                          className="flex items-center"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          プラン変更
                        </HIGButton>
                      </div>
                      
                      {userDetails.organizations[0]?.admin_plan_override && userDetails.organizations[0]?.admin_plan_notes && (
                        <div className="mb-3 p-2 bg-white rounded border-l-4 border-orange-500">
                          <div className="text-xs text-gray-600">
                            <strong>管理者メモ:</strong> {userDetails.organizations[0].admin_plan_notes}
                          </div>
                        </div>
                      )}
                      
                      {userDetails.organizations[0]?.trial_expires_at && (
                        <div className="mb-3 p-2 bg-white rounded border-l-4 border-yellow-500">
                          <div className="text-xs text-orange-600">
                            <strong>体験期限:</strong> {new Date(userDetails.organizations[0].trial_expires_at).toLocaleDateString()}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="bg-white p-2 rounded">
                          <div className="font-medium text-gray-700">利用可能機能</div>
                          <div className="mt-1 text-gray-600">
                            {(() => {
                              const plan = userDetails.organizations[0]?.plan || 'free';
                              switch(plan) {
                                case 'free': return 'サービス3件、投稿5件まで';
                                case 'basic': return 'サービス50件、投稿200件まで';
                                case 'pro': return 'サービス200件、投稿1000件まで';
                                case 'standard': return 'スタンダード機能一式';
                                case 'enterprise': return '無制限・全機能';
                                default: return '基本機能のみ';
                              }
                            })()}
                          </div>
                        </div>
                        <div className="bg-white p-2 rounded">
                          <div className="font-medium text-gray-700">使用状況</div>
                          <div className="mt-1 text-gray-600">
                            コンテンツ: {userDetails.stats.totalContent}件
                            <br />公開中: {userDetails.stats.publishedContent}件
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 組織情報 */}
                  {userDetails.organizations.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-gray-900 mb-3">組織詳細</h4>
                      {userDetails.organizations.map((org) => (
                        <div key={org.id} className="border rounded-lg p-4 mb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{org.name}</h5>
                              <p className="text-sm text-gray-600 mt-1">{org.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>スラッグ: {org.slug}</span>
                                <span className={`px-2 py-1 rounded ${org.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {org.is_published ? '公開中' : '非公開'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {org.url && (
                                <a href={org.url} target="_blank" rel="noopener noreferrer" className="text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)]">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              )}
                              <div className="relative">
                                <button
                                  className="text-gray-400 hover:text-gray-600"
                                  onClick={() => {
                                    const menu = document.getElementById(`org-menu-${org.id}`);
                                    menu?.classList.toggle('hidden');
                                  }}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                                <div id={`org-menu-${org.id}`} className="hidden absolute right-0 mt-1 bg-white border rounded shadow-lg z-10">
                                  <button
                                    onClick={() => executeContentAction('organization', org.id, org.is_published ? 'unpublish' : 'publish')}
                                    disabled={actionLoading}
                                    className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                                  >
                                    {org.is_published ? <Pause className="h-3 w-3 inline mr-2" /> : <Play className="h-3 w-3 inline mr-2" />}
                                    {org.is_published ? '非公開にする' : '公開する'}
                                  </button>
                                  <button
                                    onClick={() => executeContentAction('organization', org.id, 'suspend', '管理者による停止')}
                                    disabled={actionLoading}
                                    className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 text-yellow-600"
                                  >
                                    <AlertTriangle className="h-3 w-3 inline mr-2" />
                                    停止する
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* コンテンツ一覧 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* サービス */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-md font-semibold text-gray-900 flex items-center">
                          <Briefcase className="h-4 w-4 mr-2" />
                          サービス ({userDetails.content.services.length})
                        </h4>
                        <button
                          onClick={() => openCreateModal('service')}
                          className="text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)] text-sm flex items-center"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          新規作成
                        </button>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {userDetails.content.services.map((service) => (
                          <ContentItem
                            key={service.id}
                            item={service}
                            type="service"
                            onAction={executeContentAction}
                            actionLoading={actionLoading}
                          />
                        ))}
                        {userDetails.content.services.length === 0 && (
                          <p className="text-sm text-gray-500 italic">サービスがありません</p>
                        )}
                      </div>
                    </div>

                    {/* 投稿 */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-md font-semibold text-gray-900 flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          投稿 ({userDetails.content.posts.length})
                        </h4>
                        <button
                          onClick={() => openCreateModal('post')}
                          className="text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)] text-sm flex items-center"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          新規作成
                        </button>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {userDetails.content.posts.map((post) => (
                          <ContentItem
                            key={post.id}
                            item={post}
                            type="post"
                            onAction={executeContentAction}
                            actionLoading={actionLoading}
                          />
                        ))}
                        {userDetails.content.posts.length === 0 && (
                          <p className="text-sm text-gray-500 italic">投稿がありません</p>
                        )}
                      </div>
                    </div>

                    {/* ケーススタディ */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-md font-semibold text-gray-900 flex items-center">
                          <BookOpen className="h-4 w-4 mr-2" />
                          ケーススタディ ({userDetails.content.caseStudies.length})
                        </h4>
                        <button
                          onClick={() => openCreateModal('case_study')}
                          className="text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)] text-sm flex items-center"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          新規作成
                        </button>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {userDetails.content.caseStudies.map((caseStudy) => (
                          <ContentItem
                            key={caseStudy.id}
                            item={caseStudy}
                            type="case_study"
                            onAction={executeContentAction}
                            actionLoading={actionLoading}
                          />
                        ))}
                        {userDetails.content.caseStudies.length === 0 && (
                          <p className="text-sm text-gray-500 italic">ケーススタディがありません</p>
                        )}
                      </div>
                    </div>

                    {/* FAQ */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-md font-semibold text-gray-900 flex items-center">
                          <HelpCircle className="h-4 w-4 mr-2" />
                          FAQ ({userDetails.content.faqs.length})
                        </h4>
                        <button
                          onClick={() => openCreateModal('faq')}
                          className="text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)] text-sm flex items-center"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          新規作成
                        </button>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {userDetails.content.faqs.map((faq) => (
                          <ContentItem
                            key={faq.id}
                            item={faq}
                            type="faq"
                            onAction={executeContentAction}
                            actionLoading={actionLoading}
                          />
                        ))}
                        {userDetails.content.faqs.length === 0 && (
                          <p className="text-sm text-gray-500 italic">FAQがありません</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 管理アクション */}
                  <div className="border-t pt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">ユーザー管理アクション</h4>
                    <div className="flex flex-wrap gap-3">
                      {selectedUser.role === 'user' ? (
                        <button
                          onClick={() => updateUserRole(selectedUser.id, 'admin')}
                          disabled={updating}
                          className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 flex items-center"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          管理者権限を付与
                        </button>
                      ) : (
                        <button
                          onClick={() => updateUserRole(selectedUser.id, 'user')}
                          disabled={updating}
                          className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 flex items-center"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          一般ユーザーに変更
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteUser(selectedUser.id)}
                        disabled={updating}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        ユーザーを削除
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">詳細情報の取得に失敗しました</p>
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setUserDetails(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 代理作成モーダル */}
      {showCreateModal && selectedUser && createType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {createType === 'service' && 'サービス作成'}
                  {createType === 'post' && '投稿作成'}
                  {createType === 'faq' && 'FAQ作成'}
                  {createType === 'case_study' && 'ケーススタディ作成'}
                  - {selectedUser.email} の代理
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateType(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <ProxyCreateForm
                type={createType}
                onSubmit={createProxyContent}
                onCancel={() => {
                  setShowCreateModal(false);
                  setCreateType(null);
                }}
                loading={createLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* プラン変更モーダル */}
      {showPlanModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  プラン変更 - {selectedUser.email}
                </h3>
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <PlanChangeForm
                onSubmit={changePlan}
                onCancel={() => setShowPlanModal(false)}
                loading={planLoading}
                currentPlan={userDetails?.organizations[0]?.plan || 'free'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// プラン変更フォームコンポーネント
function PlanChangeForm({ onSubmit, onCancel, loading, currentPlan }: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  currentPlan: string;
}) {
  const [formData, setFormData] = useState({
    plan: currentPlan,
    override_reason: '',
    admin_notes: '',
    trial_expires_at: ''
  });

  const planOptions = [
    { value: 'free', label: '無料プラン', description: 'サービス3件、投稿5件まで' },
    { value: 'basic', label: 'ベーシック', description: 'サービス50件、投稿200件まで' },
    { value: 'pro', label: 'プロ', description: 'サービス200件、投稿1000件まで' },
    { value: 'standard', label: 'スタンダード', description: '企業向け標準プラン' },
    { value: 'enterprise', label: 'エンタープライズ', description: '無制限・カスタム機能' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.override_reason.trim()) {
      alert('変更理由は必須です');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        {/* 現在のプラン表示 */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <span className="text-sm text-gray-700">現在のプラン: </span>
          <span className="font-medium text-gray-900">{currentPlan}</span>
        </div>

        {/* 新しいプラン選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            新しいプラン <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {planOptions.map((option) => (
              <label key={option.value} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="plan"
                  value={option.value}
                  checked={formData.plan === option.value}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  className="mt-1 text-[var(--aio-primary)] focus:ring-[var(--aio-primary)]"
                />
                <div>
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-500">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 変更理由 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            変更理由 <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            required
            value={formData.override_reason}
            onChange={(e) => setFormData({ ...formData, override_reason: e.target.value })}
            placeholder="プラン変更の理由を記録してください..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
          />
        </div>

        {/* 管理者メモ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">管理者メモ</label>
          <textarea
            rows={2}
            value={formData.admin_notes}
            onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
            placeholder="追加のメモや注意事項..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
          />
        </div>

        {/* 体験期限 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">体験期限（任意）</label>
          <input
            type="date"
            value={formData.trial_expires_at}
            onChange={(e) => setFormData({ ...formData, trial_expires_at: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
          />
          <p className="text-xs text-gray-500 mt-1">
            設定すると体験版として扱われ、期限後に元のプランに戻ります
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          disabled={loading}
        >
          キャンセル
        </button>
        <HIGButton
          type="submit"
          disabled={loading || !formData.override_reason.trim()}
          variant="primary"
          size="md"
          className="flex-1 flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              変更中...
            </>
          ) : (
            '変更'
          )}
        </HIGButton>
      </div>
    </form>
  );
}

// 代理作成フォームコンポーネント
function ProxyCreateForm({ type, onSubmit, onCancel, loading }: {
  type: 'service' | 'post' | 'faq' | 'case_study';
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState<any>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, admin_notes: formData.admin_notes || '管理者による代理作成' });
  };

  const renderFormFields = () => {
    switch (type) {
      case 'service':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                サービス名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">説明</label>
              <textarea
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">価格</label>
                <input
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">所要時間（分）</label>
                <input
                  type="number"
                  value={formData.duration || ''}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
                />
              </div>
            </div>
          </>
        );

      case 'post':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                スラッグ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.slug || ''}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
                placeholder="url-friendly-name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">本文</label>
              <textarea
                rows={6}
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">抜粋</label>
              <textarea
                rows={2}
                value={formData.excerpt || ''}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
              />
            </div>
          </>
        );

      case 'faq':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                質問 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.question || ''}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                回答 <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={formData.answer || ''}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
              <input
                type="text"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
              />
            </div>
          </>
        );

      case 'case_study':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">クライアント名</label>
              <input
                type="text"
                value={formData.client_name || ''}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">課題</label>
              <textarea
                rows={3}
                value={formData.challenge || ''}
                onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">解決策</label>
              <textarea
                rows={3}
                value={formData.solution || ''}
                onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">結果</label>
              <textarea
                rows={3}
                value={formData.results || ''}
                onChange={(e) => setFormData({ ...formData, results: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {renderFormFields()}
      
      {/* 共通フィールド */}
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.is_published || false}
            onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
            className="rounded border-gray-300 text-[var(--aio-primary)] focus:ring-[var(--aio-primary)]"
          />
          <span className="ml-2 text-sm text-gray-700">すぐに公開する</span>
        </label>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">管理者メモ</label>
        <textarea
          rows={2}
          value={formData.admin_notes || ''}
          onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
          placeholder="作成理由や注意事項などを記録..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)]"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          disabled={loading}
        >
          キャンセル
        </button>
        <HIGButton
          type="submit"
          disabled={loading}
          variant="primary"
          size="md"
          className="flex-1 flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              作成中...
            </>
          ) : (
            '作成'
          )}
        </HIGButton>
      </div>
    </form>
  );
}

// コンテンツアイテムコンポーネント
function ContentItem({ item, type, onAction, actionLoading }: {
  item: any;
  type: string;
  onAction: (type: string, id: string, action: string, reason?: string) => void;
  actionLoading: boolean;
}) {
  const getTitle = () => {
    return item.name || item.title || item.question || 'タイトルなし';
  };

  const getStatusColor = () => {
    if (item.is_published) return 'bg-green-100 text-green-800';
    if (item.status === 'suspended') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = () => {
    if (item.status === 'suspended') return '停止中';
    return item.is_published ? '公開中' : '非公開';
  };

  return (
    <div className="border border-gray-200 rounded p-3 bg-white">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h6 className="font-medium text-sm text-gray-900 truncate">{getTitle()}</h6>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-1 text-xs rounded ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(item.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="relative ml-2">
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={() => {
              const menu = document.getElementById(`content-menu-${item.id}`);
              menu?.classList.toggle('hidden');
            }}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          <div id={`content-menu-${item.id}`} className="hidden absolute right-0 mt-1 bg-white border rounded shadow-lg z-20 min-w-32">
            {item.status !== 'suspended' && (
              <button
                onClick={() => onAction(type, item.id, item.is_published ? 'unpublish' : 'publish')}
                disabled={actionLoading}
                className="block w-full px-3 py-2 text-xs text-left hover:bg-gray-100"
              >
                {item.is_published ? <Pause className="h-3 w-3 inline mr-1" /> : <Play className="h-3 w-3 inline mr-1" />}
                {item.is_published ? '非公開' : '公開'}
              </button>
            )}
            <button
              onClick={() => onAction(type, item.id, 'suspend', '管理者による停止')}
              disabled={actionLoading}
              className="block w-full px-3 py-2 text-xs text-left hover:bg-gray-100 text-yellow-600"
            >
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              停止
            </button>
            <button
              onClick={() => onAction(type, item.id, 'delete', '管理者による削除')}
              disabled={actionLoading}
              className="block w-full px-3 py-2 text-xs text-left hover:bg-gray-100 text-red-600"
            >
              <Archive className="h-3 w-3 inline mr-1" />
              削除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}