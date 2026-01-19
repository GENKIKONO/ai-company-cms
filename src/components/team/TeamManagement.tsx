'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Shield, Crown, Edit3, Eye, Trash2, Mail } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import type { UserRole } from '@/types/utils/database';
import { logger } from '@/lib/utils/logger';

interface TeamMember {
  id: string;
  user_id: string;
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
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('viewer');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchTeamMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 現在のユーザーIDを取得
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      // organization_members と profiles を JOIN して取得
      const { data: membersData, error: membersError } = await supabase
        .from('organization_members')
        .select(`
          id,
          user_id,
          role,
          created_at,
          profiles (
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('organization_id', organizationId);

      if (membersError) {
        throw membersError;
      }

      // データを TeamMember 形式に変換
      const teamMembers: TeamMember[] = (membersData || []).map((member: any) => ({
        id: member.id,
        user_id: member.user_id,
        email: member.profiles?.email || '',
        full_name: member.profiles?.full_name || undefined,
        role: member.role as UserRole,
        avatar_url: member.profiles?.avatar_url || undefined,
        created_at: member.created_at,
        last_active: undefined, // 実際の last_active は別テーブルで管理
        status: 'active' as const,
      }));

      setMembers(teamMembers);
    } catch (err) {
      logger.error('Failed to fetch team members', { data: err instanceof Error ? err : new Error(String(err)) });
      setError('チームメンバーの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [organizationId, supabase]);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  const handleInviteMember = async () => {
    if (!inviteEmail) return;

    // 招待機能は今後実装予定
    // 現状は招待フォームを表示しないようにする
    setInviteEmail('');
    setShowInviteForm(false);
  };

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    try {
      const { error: updateError } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (updateError) {
        throw updateError;
      }

      setMembers(members.map(member =>
        member.id === memberId ? { ...member, role: newRole } : member
      ));
    } catch (err) {
      logger.error('Failed to update member role', { data: err instanceof Error ? err : new Error(String(err)) });
      alert('ロールの更新に失敗しました');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('このメンバーを削除しますか？')) return;

    try {
      const { error: deleteError } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (deleteError) {
        throw deleteError;
      }

      setMembers(members.filter(member => member.id !== memberId));
    } catch (err) {
      logger.error('Failed to remove member', { data: err instanceof Error ? err : new Error(String(err)) });
      alert('メンバーの削除に失敗しました');
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'editor': return <Edit3 className="w-4 h-4 text-[var(--aio-primary)]" />;
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
          <Users className="w-6 h-6 text-[var(--aio-primary)]" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">チーム管理</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-[var(--color-text-secondary)]">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-[var(--aio-primary)]" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">チーム管理</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-[var(--aio-danger)]">{error}</div>
          <button
            onClick={fetchTeamMembers}
            className="mt-4 btn btn-secondary btn-small"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`card p-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-[var(--aio-primary)]" />
          <h3 className="text-lg font-semibold text-neutral-900">チーム管理</h3>
          <span className="px-2 py-1 bg-[var(--aio-info-muted)] text-[var(--aio-info)] text-sm rounded-full">
            {members.length}名
          </span>
        </div>
        
        {/* 招待機能は今後実装予定のため一時的に非表示 */}
        {/* {canManageMembers && (
          <button
            onClick={() => setShowInviteForm(true)}
            className="btn btn-primary btn-small"
          >
            <UserPlus className="w-4 h-4" />
            メンバー招待
          </button>
        )} */}
      </div>

      {/* 招待フォーム - 今後実装予定のため一時的に非表示 */}
      {/* {showInviteForm && (
        <div className="mb-6 p-4 rounded-lg bg-[var(--aio-info-surface)] border border-[var(--aio-info-border)]">
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
      )} */}

      {/* メンバー一覧 */}
      <div className="space-y-3">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="flex items-center gap-3">
              {/* アバター */}
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                {member.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
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
                    disabled={member.user_id === currentUserId} // 自分自身の権限は変更不可
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
              {canManageMembers && member.user_id !== currentUserId && (
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
            <Edit3 className="w-4 h-4 text-[var(--aio-primary)]" />
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