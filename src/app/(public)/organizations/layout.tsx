export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getServerUserWithStatus } from '@/lib/auth/server';
import { DashboardLayoutContent } from '@/components/dashboard/DashboardLayoutContent';
import type { AccountStatus } from '@/lib/auth/account-status-guard';

export default async function OrganizationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  // 🌐 企業ディレクトリは公開ページとして設定
  // このlayoutは /organizations (一覧) のみに適用される
  // /organizations/[id] などの編集ページは別のlayoutで処理される
  
  // 認証情報を取得（エラーが出ても処理を続行）
  let userProfile;
  try {
    userProfile = await getServerUserWithStatus();
  } catch (error) {
    // 認証エラーの場合も公開ページなのでnullとして扱う
    userProfile = null;
  }

  // 🔒 ログインユーザーの場合は管理画面レイアウトを適用
  if (userProfile) {
    const accountStatus: AccountStatus = userProfile.accountStatus;

    // If account is deleted, redirect to login (session should be invalid)
    if (accountStatus === 'deleted') {
      redirect('/auth/login');
    }

    // Render using the same DashboardLayoutContent for authenticated users
    return (
      <DashboardLayoutContent accountStatus={accountStatus}>
        {children}
      </DashboardLayoutContent>
    );
  }

  // 🌐 未認証ユーザー向けの公開レイアウト（企業ディレクトリ一覧用）
  // リダイレクトは一切行わない - 公開ページとして表示
  return <>{children}</>;
}