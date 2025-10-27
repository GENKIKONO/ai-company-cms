// 安全なAuthHeader - Server Component with Client Component integration
import FallbackHeader from './FallbackHeader';
import ClientAuthHeader from './ClientAuthHeader';
import { getUserWithAdmin } from '@/lib/auth/server';
import { logger } from '@/lib/utils/logger';

export default async function SafeAuthHeader() {
  try {
    // 認証と管理者権限チェック
    const { user, isAdmin } = await getUserWithAdmin();
    const isAuthenticated = !!user;
    
    // 企業の存在確認（認証済みの場合のみ）
    let hasOrganization = false;
    if (isAuthenticated) {
      try {
        const { supabaseServer } = await import('@/lib/supabase-server');
        const supabase = await supabaseServer();
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id')
          .eq('created_by', user!.id)
          .single();
        hasOrganization = !!orgData;
      } catch {
        // 企業確認エラーは無視（安全なデフォルト）
        hasOrganization = false;
      }
    }

    // Client Componentにデータを渡してレンダリング
    return <ClientAuthHeader 
      initialUser={user} 
      initialHasOrganization={hasOrganization} 
      initialIsAdmin={isAdmin}
    />;
  } catch (e) {
    logger.error('[SafeAuthHeader] AuthHeader render failed:', e);
    return <FallbackHeader />;
  }
}