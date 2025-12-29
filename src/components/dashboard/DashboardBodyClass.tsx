'use client';

import { useEffect } from 'react';

/**
 * ダッシュボードページ用のbodyクラス管理コンポーネント
 * ダッシュボードページでは公開ヘッダー/フッターを非表示にするために
 * bodyに'dashboard-page'クラスを追加する
 */
export function DashboardBodyClass() {
  useEffect(() => {
    // bodyにdashboard-pageクラスを追加
    document.body.classList.add('dashboard-page');

    return () => {
      // クリーンアップ: クラスを削除
      document.body.classList.remove('dashboard-page');
    };
  }, []);

  return null;
}
