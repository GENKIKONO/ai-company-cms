'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Building, Mail, Calendar, Shield, Edit, Trash2, Eye, Search } from 'lucide-react';

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
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'ユーザーデータの取得に失敗しました');
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Fetch users error:', err);
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
          <Link href="/management-console" className="text-blue-600 hover:text-blue-700">
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
          <div className="text-2xl font-bold text-blue-600">{userStats.user}</div>
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
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full text-sm focus:ring-blue-500 focus:border-blue-500"
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
                        onClick={() => {
                          setSelectedUser(user);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 mr-3"
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

      {/* ユーザー詳細モーダル */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">ユーザー詳細</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">権限</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleColors[selectedUser.role]}`}>
                    <Shield className="h-3 w-3 mr-1" />
                    {roleLabels[selectedUser.role]}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">所属組織</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedUser.organizations?.name || '未設定'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">登録日時</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedUser.created_at).toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">最終ログイン</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedUser.last_sign_in_at 
                      ? new Date(selectedUser.last_sign_in_at).toLocaleString()
                      : 'ログイン履歴なし'
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">メール認証</label>
                  <p className="mt-1 text-sm">
                    {selectedUser.email_confirmed_at ? (
                      <span className="text-green-600">認証済み ({new Date(selectedUser.email_confirmed_at).toLocaleDateString()})</span>
                    ) : (
                      <span className="text-yellow-600">未認証</span>
                    )}
                  </p>
                </div>

                {/* アクションボタン */}
                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">管理アクション</h4>
                  <div className="flex flex-col gap-3">
                    {selectedUser.role === 'user' ? (
                      <button
                        onClick={() => updateUserRole(selectedUser.id, 'admin')}
                        disabled={updating}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        管理者権限を付与
                      </button>
                    ) : (
                      <button
                        onClick={() => updateUserRole(selectedUser.id, 'user')}
                        disabled={updating}
                        className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        一般ユーザーに変更
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteUser(selectedUser.id)}
                      disabled={updating}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      ユーザーを削除
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}