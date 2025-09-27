'use client';

// グローバルエラーバウンダリ - Server Components の例外を握り潰す
export default function GlobalError({ 
  error, 
  reset 
}: { 
  error: Error; 
  reset: () => void 
}) {
  console.error('[GlobalError]', error);
  
  return (
    <html>
      <body>
        <div style={{ padding: 16 }}>
          <h1>一時的なエラーが発生しました</h1>
          <p>数秒後にリロードしてください。</p>
          <button onClick={() => reset()}>再読み込み</button>
        </div>
      </body>
    </html>
  );
}