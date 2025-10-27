'use client';

import { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Crown, Edit3, Eye, Trash2, Mail } from 'lucide-react';
import type { UserRole } from '@/types/database';
import { logger } from '@/lib/utils/logger';

interface TeamMember {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  last_active?: string;
  status: 'active' | 'pending' | 'inactive';
}

interface TeamManagementProps {
  organizationId: string;
  currentUserRole: UserRole;
  className?: string;
}

export function TeamManagement({ organizationId, currentUserRole, className = '' }: TeamManagementProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('viewer');

  useEffect(() => {
    fetchTeamMembers();
  }, [organizationId]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      // モック実装 - 実際の実装ではSupabaseからチームメンバーを取得
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockMembers: TeamMember[] = [
        {
          id: '1',
          email: 'admin@example.com',
          full_name: '管理者 太郎',
          role: 'admin',
          avatar_url: undefined,
          created_at: '2024-01-01T00:00:00Z',
          last_active: '2024-01-15T10:30:00Z',
          status: 'active'
        },
        {
          id: '2',
          email: 'editor@example.com',
          full_name: '編集者 花子',
          role: 'editor',
          avatar_url: undefined,
          created_at: '2024-01-05T00:00:00Z',
          last_active: '2024-01-14T16:45:00Z',
          status: 'active'
        },
        {
          id: '3',
          email: 'viewer@example.com',
          full_name: '閲覧者 次郎',
          role: 'viewer',
          avatar_url: undefined,
          created_at: '2024-01-10T00:00:00Z',
          last_active: '2024-01-12T09:15:00Z',
          status: 'active'
        }
      ];

      setMembers(mockMembers);
    } catch (error) {
      logger.error('Failed to fetch team members', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail) return;

    try {
      // モック実装 - 実際の実装ではSupabaseでメンバー招待
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newMember: TeamMember = {
        id: Date.now().toString(),
        email: inviteEmail,
        full_name: undefined,
        role: inviteRole,
        avatar_url: undefined,
        created_at: new Date().toISOString(),
        last_active: undefined,
        status: 'pending'
      };

      setMembers([...members, newMember]);
      setInviteEmail('');
      setShowInviteForm(false);
    } catch (error) {
      logger.error('Failed to invite member', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    try {
      // モック実装 - 実際の実装ではSupabaseでロール更新
      await new Promise(resolve => setTimeout(resolve, 500));

      setMembers(members.map(member => 
        member.id === memberId ? { ...member, role: newRole } : member
      ));
    } catch (error) {
      logger.error('Failed to update member role', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('このメンバーを削除しますか？')) return;

    try {
      // モック実装 - 実際の実装ではSupabaseでメンバー削除
      await new Promise(resolve => setTimeout(resolve, 500));

      setMembers(members.filter(member => member.id !== memberId));
    } catch (error) {
      logger.error('Failed to remove member', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'editor': return <Edit3 className="w-4 h-4 text-blue-600" />;
      case 'viewer': return <Eye className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleName = (role: UserRole) => {
    switch (role) {
      case 'admin': return '管理者';
      case 'editor': return '編集者';
      case 'viewer': return '閲覧者';
    }
  };

  const getRoleDescription = (role: UserRole) => {
    switch (role) {
      case 'admin': return '全ての機能にアクセス可能';
      case 'editor': return 'コンテンツの編集・公開が可能';
      case 'viewer': return '閲覧のみ可能';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">アクティブ</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">招待中</span>;
      case 'inactive':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">非アクティブ</span>;
    }
  };

  const canManageMembers = currentUserRole === 'admin';

  if (loading) {
    return (
      <div className={`card p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-neutral-900">チーム管理</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-neutral-600">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card p-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-neutral-900">チーム管理</h3>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
            {members.length}名
          </span>
        </div>
        
        {canManageMembers && (
          <button
            onClick={() => setShowInviteForm(true)}
            className="btn btn-primary btn-small"
          >
            <UserPlus className="w-4 h-4" />
            メンバー招待
          </button>
        )}
      </div>

      {/* 招待フォーム */}
      {showInviteForm && (
        <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <h4 className="font-medium text-neutral-900 mb-3">新しいメンバーを招待</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="input w-full"
                placeholder="example@company.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                権限
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="input w-full"
              >
                <option value="viewer">閲覧者 - 閲覧のみ</option>
                <option value="editor">編集者 - 編集・公開可能</option>
                <option value="admin">管理者 - 全権限</option>
              </select>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleInviteMember}
                disabled={!inviteEmail}
                className="btn btn-primary btn-small"
              >
                <Mail className="w-4 h-4" />
                招待を送信
              </button>
              <button
                onClick={() => setShowInviteForm(false)}
                className="btn btn-secondary btn-small"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* メンバー一覧 */}
      <div className="space-y-3">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="flex items-center gap-3">
              {/* アバター */}
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <span className="text-sm font-medium text-gray-600">
                    {member.full_name ? member.full_name[0] : member.email[0].toUpperCase()}
                  </span>
                )}
              </div>

              {/* メンバー情報 */}
              <div>
                <div className="font-medium text-neutral-900">
                  {member.full_name || member.email}
                </div>
                <div className="text-sm text-neutral-600">
                  {member.full_name && member.email}
                </div>
                {member.last_active && (
                  <div className="text-xs text-neutral-500">
                    最終アクティブ: {new Date(member.last_active).toLocaleDateString('ja-JP')}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* ステータス */}
              {getStatusBadge(member.status)}

              {/* ロール */}
              <div className="flex items-center gap-2">
                {getRoleIcon(member.role)}
                {canManageMembers && member.status === 'active' ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                    disabled={member.id === '1'} // 自分自身の権限は変更不可（仮実装）
                  >
                    <option value="viewer">閲覧者</option>
                    <option value="editor">編集者</option>
                    <option value="admin">管理者</option>
                  </select>
                ) : (
                  <span className="text-sm text-neutral-700">{getRoleName(member.role)}</span>
                )}
              </div>

              {/* アクション */}
              {canManageMembers && member.id !== '1' && (
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="メンバーを削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 権限説明 */}
      <div className="mt-6 p-4 rounded-lg bg-gray-50">
        <h4 className="font-medium text-neutral-900 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          権限について
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-600" />
            <span className="font-medium">管理者:</span>
            <span className="text-neutral-600">チーム管理、請求、全コンテンツの管理</span>
          </div>
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-blue-600" />
            <span className="font-medium">編集者:</span>
            <span className="text-neutral-600">コンテンツの作成・編集・公開</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-600" />
            <span className="font-medium">閲覧者:</span>
            <span className="text-neutral-600">ダッシュボードとコンテンツの閲覧のみ</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeamManagement;