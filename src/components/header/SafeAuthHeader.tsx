// 安全なAuthHeader - Server Component with Client Component integration
import FallbackHeader from './FallbackHeader';
import ClientAuthHeader from './ClientAuthHeader';

export default async function SafeAuthHeader() {
  try {
    // Supabaseクライアント作成を安全に実行
    const { supabaseServer } = await import('@/lib/supabase-server');
    const supabase = await supabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    const isAuthenticated = !error && !!user;
    
    // 企業の存在確認（認証済みの場合のみ）
    let hasOrganization = false;
    if (isAuthenticated) {
      try {
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
    return <ClientAuthHeader initialUser={user} initialHasOrganization={hasOrganization} />;
  } catch (e) {
    console.error('[SafeAuthHeader] AuthHeader render failed:', e);
    return <FallbackHeader />;
  }
}