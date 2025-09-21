'use client';

import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase-client';

interface ConsentRecord {
  id: string;
  null_id: string;
  consent_type: 'terms' | 'privacy' | 'disclaimer' | 'marketing';
  version: string;
  granted: boolean;
  granted_at: string;
  ip_address: string;
  null_agent: string;
}

interface ConsentManagerProps {
  nullId?: string;
  organizationId?: string;
  context: 'registration' | 'publication' | 'subscription' | 'general';
  onConsentChange?: (consents: Record<string, boolean>) => void;
  required?: ('terms' | 'privacy' | 'disclaimer' | 'marketing')[];
  className?: string;
}

const LEGAL_TEXTS = {
  terms: {
    title: '利用規約',
    summary: 'LuxuCareサービスの利用に関する規約です。',
    content: `
## LuxuCare利用規約

### 第1条（目的）
本規約は、株式会社LuxuCare（以下「当社」）が提供するAI対応企業情報管理システム「LuxuCare」（以下「本サービス」）の利用条件を定めるものです。

### 第2条（定義）
1. 「ユーザー」とは、本サービスを利用する個人または法人をいいます
2. 「コンテンツ」とは、本サービス上に投稿・掲載される文章、画像、動画等の情報をいいます
3. 「企業情報」とは、ユーザーが登録する組織・企業に関する情報をいいます

### 第3条（利用規約の同意）
ユーザーは、本規約に同意の上、本サービスを利用するものとします。

### 第4条（サービス内容）
本サービスは、企業情報の管理・公開・SEO最適化機能を提供します。

### 第5条（禁止事項）
ユーザーは以下の行為を行ってはなりません：
1. 虚偽の情報の登録・公開
2. 第三者の権利を侵害する行為
3. 法令に違反する行為
4. 本サービスの運営を妨害する行為

### 第6条（知的財産権）
本サービスに関する知的財産権は当社に帰属します。

### 第7条（免責事項）
当社は、本サービスの利用により生じた損害について、一切の責任を負いません。

### 第8条（準拠法・管轄）
本規約は日本法に準拠し、東京地方裁判所を専属的合意管轄とします。

制定日：2024年1月1日
改定日：2024年3月1日（v1.1）
    `,
    version: '1.1'
  },
  privacy: {
    title: 'プライバシーポリシー',
    summary: '個人情報の取り扱いに関するポリシーです。',
    content: `
## プライバシーポリシー

### 1. 個人情報の利用目的
当社は、以下の目的で個人情報を利用します：
- 本サービスの提供・運営
- ユーザーサポート
- サービス改善・新機能開発
- 重要なお知らせの送信

### 2. 収集する情報
- 氏名、メールアドレス、電話番号
- 企業・組織情報
- サービス利用履歴
- アクセスログ、Cookie情報

### 3. 第三者提供
法令に基づく場合を除き、同意なく第三者に提供しません。

### 4. 外部サービス
本サービスでは以下の外部サービスを利用しています：
- Supabase（データベース）
- Stripe（決済処理）
- Resend（メール送信）
- Plausible（アクセス解析）

### 5. データ保存期間
- アカウント削除まで：基本的な登録情報
- 3年間：サービス利用履歴
- 7年間：決済関連情報（法令要求）

### 6. ユーザーの権利
- 個人情報の開示・訂正・削除請求
- 利用停止・第三者提供停止請求
- データポータビリティの権利

### 7. セキュリティ
適切な技術的・組織的安全管理措置を講じます。

### 8. お問い合わせ
個人情報に関するお問い合わせ：privacy@luxucare.ai

制定日：2024年1月1日
改定日：2024年3月1日（v1.1）
    `,
    version: '1.1'
  },
  disclaimer: {
    title: '免責事項',
    summary: 'サービス利用に関する免責事項です。',
    content: `
## 免責事項

### 1. サービスの提供
- 本サービスは「現状有姿」で提供されます
- 当社は、サービスの完全性・正確性・有用性を保証しません
- システムメンテナンス等でサービスが一時停止する場合があります

### 2. コンテンツの責任
- ユーザーが投稿するコンテンツの責任はユーザーにあります
- 当社は投稿内容の正確性について責任を負いません
- 第三者との紛争はユーザー自身で解決してください

### 3. 損害の免責
当社は以下について一切責任を負いません：
- サービス利用による直接・間接の損害
- データの消失・破損
- 第三者によるサービス妨害
- 外部サービスの障害・停止

### 4. 法的制限
本免責事項は法令の範囲内で適用されます。

制定日：2024年1月1日
改定日：2024年3月1日（v1.1）
    `,
    version: '1.1'
  },
  marketing: {
    title: 'マーケティング利用',
    summary: 'マーケティング目的での情報利用に関する同意です。',
    content: `
## マーケティング利用に関する同意

### 1. マーケティング活動
お客様により良いサービスを提供するため、以下の活動を行う場合があります：
- サービス改善のためのアンケート送信
- 新機能・キャンペーンのお知らせ
- 業界レポート・事例紹介の配信
- セミナー・イベントのご案内

### 2. 利用する情報
- ご登録いただいた基本情報
- サービス利用状況・行動履歴
- お客様の業界・規模等の属性情報

### 3. 同意の撤回
マーケティング利用の同意はいつでも撤回できます：
- アカウント設定からの変更
- メール配信停止リンク
- カスタマーサポートへの連絡

### 4. 個人情報保護
マーケティング活動においても適切に個人情報を保護します。

制定日：2024年1月1日
改定日：2024年3月1日（v1.1）
    `,
    version: '1.1'
  }
};

export default function ConsentManager({
  nullId,
  organizationId,
  context,
  onConsentChange,
  required = ['terms', 'privacy'],
  className = ''
}: ConsentManagerProps) {
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [false, setLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  useEffect(() => {
    if (nullId) {
      loadExistingConsents();
    }
  }, [nullId]);

  const loadExistingConsents = async () => {
    if (!nullId) return;
    
    setLoading(true);
    try {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from('consent_records')
        .select('consent_type, granted, version')
        .eq('null_id', nullId)
        .in('consent_type', required);

      if (!error && data) {
        const consentMap: Record<string, boolean> = {};
        data.forEach(record => {
          // 最新バージョンと一致する場合のみ有効とする
          const currentVersion = LEGAL_TEXTS[record.consent_type as keyof typeof LEGAL_TEXTS].version;
          consentMap[record.consent_type] = record.granted && record.version === currentVersion;
        });
        setConsents(consentMap);
        onConsentChange?.(consentMap);
      }
    } catch (error) {
      console.error('Failed to load consents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConsentChange = async (type: string, granted: boolean) => {
    const newConsents = { ...consents, [type]: granted };
    setConsents(newConsents);
    onConsentChange?.(newConsents);

    // データベースに記録
    if (nullId && granted) {
      await recordConsent(type, granted);
    }
  };

  const recordConsent = async (type: string, granted: boolean) => {
    if (!nullId) return;

    try {
      const supabase = supabaseBrowser();
      
      // ユーザーエージェントとIPを取得
      const nullAgent = navigator.nullAgent;
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      const { error } = await supabase
        .from('consent_records')
        .insert({
          null_id: nullId,
          organization_id: organizationId,
          consent_type: type,
          version: LEGAL_TEXTS[type as keyof typeof LEGAL_TEXTS].version,
          granted,
          granted_at: new Date().toISOString(),
          ip_address: ip,
          null_agent: nullAgent,
          context
        });

      if (error) {
        console.error('Failed to record consent:', error);
      }
    } catch (error) {
      console.error('Failed to record consent:', error);
    }
  };

  const allRequiredConsentsGranted = required.every(type => consents[type] === true);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        利用規約・プライバシーポリシー
      </h3>
      
      {false && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">同意状況を確認中...</p>
        </div>
      )}

      <div className="space-y-4">
        {required.map((type) => {
          const legal = LEGAL_TEXTS[type];
          const isExpanded = expandedSection === type;
          const isGranted = consents[type] === true;
          
          return (
            <div key={type} className="border border-gray-200 rounded-lg">
              <div className="p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id={`consent-${type}`}
                    checked={isGranted}
                    onChange={(e) => handleConsentChange(type, e.target.checked)}
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <label htmlFor={`consent-${type}`} className="block">
                      <span className="text-sm font-medium text-gray-900">
                        {legal.title}（v{legal.version}）に同意する
                        {required.includes(type as any) && <span className="text-red-500 ml-1">*</span>}
                      </span>
                      <p className="text-xs text-gray-600 mt-1">{legal.summary}</p>
                    </label>
                    
                    <button
                      onClick={() => setExpandedSection(isExpanded ? null : type)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 mt-2"
                    >
                      {isExpanded ? '内容を閉じる' : '詳細を確認する'}
                    </button>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="mt-4 p-4 bg-gray-50 rounded border">
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-xs text-gray-700 font-sans">
                        {legal.content}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!allRequiredConsentsGranted && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <span className="font-medium">ご注意：</span>
            必須項目への同意が必要です。すべての必須項目にチェックを入れてください。
          </p>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>
          同意いただいた内容は法令に基づき記録・保管されます。
          同意の撤回はアカウント設定またはカスタマーサポートから可能です。
        </p>
      </div>
    </div>
  );
}