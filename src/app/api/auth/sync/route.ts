// src/app/api/auth/sync/route.ts
// 旧クライアントが叩く可能性のある /api/auth/sync を明示的に無効化しつつ、追跡ログを出す
export async function POST(req: Request) {
  // ここに到達したら「どこかからまだ呼ばれている」証拠
  // Vercel の Function Logs に出る（Console: "Functions" タブ）
  console.warn('[KILL] /api/auth/sync was called', {
    ua: req.headers.get('user-agent') || '',
    referer: req.headers.get('referer') || '',
  });

  return new Response(JSON.stringify({ ok: false, reason: 'deprecated' }), {
    status: 410, // Gone
    headers: { 'content-type': 'application/json' },
  });
}