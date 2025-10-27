'use client';
import { logger } from '@/lib/utils/logger';


// グローバルエラーバウンダリ - Server Components の例外を握り潰す
export default function GlobalError({ 
  error, 
  reset 
}: { 
  error: Error; 
  reset: () => void 
}) {
  logger.error('[GlobalError]', error instanceof Error ? error : new Error(String(error)));
  
  return (
    <html>
      <body>
        <div className="p-4">
          <h1>一時的なエラーが発生しました</h1>
          <p>数秒後にリロードしてください。</p>
          <button onClick={() => reset()}>再読み込み</button>
        </div>
      </body>
    </html>
  );
}