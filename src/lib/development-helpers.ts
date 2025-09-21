// 開発環境用のヘルパー関数とモックデータ

export const isDevelopment = process.env.NEXT_PUBLIC_APP_ENV === 'development';

// モック用のサンプル企業データ
export const SAMPLE_ORGANIZATION = {
  id: 'sample-org-id',
  name: 'サンプル株式会社',
  slug: 'sample-company',
  description: 'これはサンプルの企業情報です。LuxuCareを使用した企業情報管理システムのデモンストレーションとして作成されています。AIを活用したマーケティングソリューションを提供し、お客様のビジネス成長をサポートします。',
  status: 'published',
  url: 'https://sample-company.example.com',
  telephone: '03-1234-5678',
  email: 'info@sample-company.example.com',
  email_public: true,
  address_region: '東京都',
  address_locality: '港区',
  street_address: '赤坂1-2-3',
  postal_code: '107-0052',
  logo_url: 'https://via.placeholder.com/200x100/4F46E5/FFFFFF?text=Sample+Co.',
  founded: '2020-01-01',
  legal_form: '株式会社',
  representative_name: '山田 太郎',
  capital: 10000000,
  employees: 50,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-03-01T00:00:00Z',
  published_at: '2024-02-01T00:00:00Z'
};

export const SAMPLE_SERVICES = [
  {
    id: 'service-1',
    org_id: 'sample-org-id',
    name: 'AIマーケティングオートメーション',
    summary: 'AIを活用したマーケティング自動化ツールです。顧客行動を分析し、最適なタイミングで最適なメッセージを配信します。',
    features: [
      'リアルタイム顧客行動分析',
      'パーソナライズドメッセージ配信',
      'A/Bテスト自動実行',
      'ROI測定ダッシュボード',
      '多チャネル連携'
    ],
    category: 'マーケティング',
    price: '月額50,000円〜',
    cta_url: 'https://sample-company.example.com/ai-marketing',
    status: 'published',
    created_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 'service-2',
    org_id: 'sample-org-id',
    name: 'データ分析コンサルティング',
    summary: 'ビジネスデータを活用した戦略的意思決定をサポートします。データサイエンティストによる専門的な分析と提案を提供します。',
    features: [
      '現状分析・課題抽出',
      'KPI設計・モニタリング',
      '予測モデル構築',
      'ダッシュボード作成',
      'レポート自動化'
    ],
    category: 'コンサルティング',
    price: '要見積もり',
    cta_url: 'https://sample-company.example.com/consulting',
    status: 'published',
    created_at: '2024-01-20T00:00:00Z'
  }
];

export const SAMPLE_FAQS = [
  {
    id: 'faq-1',
    org_id: 'sample-org-id',
    question: 'サービスの導入にはどれくらいの期間が必要ですか？',
    answer: '通常、お申し込みから運用開始まで2-4週間程度です。お客様の既存システムとの連携や要件により期間は変動する場合があります。詳細なスケジュールは個別にご相談させていただきます。',
    sort_order: 1
  },
  {
    id: 'faq-2',
    org_id: 'sample-org-id',
    question: '料金体系について教えてください',
    answer: 'ご利用規模や機能に応じた段階的な料金プランをご用意しています。基本プランは月額50,000円からで、従量課金制のオプションもございます。無料トライアルも実施しておりますので、まずはお気軽にお試しください。',
    sort_order: 2
  },
  {
    id: 'faq-3',
    org_id: 'sample-org-id',
    question: 'セキュリティ対策はどのようになっていますか？',
    answer: 'ISO27001準拠のセキュリティ体制を構築しており、データの暗号化、アクセス制御、定期的な脆弱性診断を実施しています。また、GDPR、個人情報保護法にも対応しており、お客様の大切なデータを安全に保護します。',
    sort_order: 3
  }
];

export const SAMPLE_CASE_STUDIES = [
  {
    id: 'case-1',
    org_id: 'sample-org-id',
    title: 'EC事業者様のコンバージョン率300%向上事例',
    client_type: 'Eコマース',
    client_name: null, // 匿名
    problem: 'Webサイトの訪問者は多いものの、コンバージョン率が低く、売上が伸び悩んでいました。また、どの施策が効果的なのか測定できずにいました。',
    solution: 'AIマーケティングオートメーションを導入し、訪問者の行動パターンを分析。パーソナライズされた商品レコメンドとタイミング最適化を実装しました。',
    outcome: 'コンバージョン率が従来比300%向上し、月間売上が2倍に増加。カスタマーライフタイムバリューも40%向上しました。',
    metrics: {
      'コンバージョン率向上': '300%',
      '月間売上増加': '200%',
      'LTV向上': '40%',
      '導入期間': '3週間'
    },
    published_at: '2024-02-15T00:00:00Z',
    is_anonymous: true
  },
  {
    id: 'case-2',
    org_id: 'sample-org-id',
    title: '製造業における予測メンテナンス導入成功事例',
    client_type: '製造業',
    client_name: 'ABC製造株式会社',
    problem: '設備の突発的な故障により生産ラインが停止し、大きな損失が発生していました。従来の定期メンテナンスでは効率が悪く、コストもかさんでいました。',
    solution: '機械学習を活用した予測メンテナンスシステムを構築。センサーデータをリアルタイム分析し、故障予兆を早期発見できるようになりました。',
    outcome: '設備停止時間を70%削減し、メンテナンスコストも30%削減。生産効率が大幅に向上しました。',
    metrics: {
      '設備停止時間削減': '70%',
      'メンテナンスコスト削減': '30%',
      '故障予測精度': '95%',
      '投資回収期間': '8ヶ月'
    },
    published_at: '2024-01-30T00:00:00Z',
    is_anonymous: false
  }
];

// 開発用のモック関数
export function createMockSupabase() {
  return {
    auth: {
      getUser: () => Promise.resolve({
        data: { user: { id: 'dev-user-id', email: 'dev@example.com' } },
        error: null
      }),
      signInWithPassword: () => Promise.resolve({
        data: { user: { id: 'dev-user-id', email: 'dev@example.com' } },
        error: null
      })
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: () => {
            if (table === 'organizations') {
              return Promise.resolve({ data: SAMPLE_ORGANIZATION, error: null });
            }
            return Promise.resolve({ data: null, error: null });
          },
          order: () => Promise.resolve({
            data: table === 'services' ? SAMPLE_SERVICES :
                  table === 'faqs' ? SAMPLE_FAQS :
                  table === 'case_studies' ? SAMPLE_CASE_STUDIES : [],
            error: null
          })
        })
      })
    })
  };
}

// 開発用のモック通知
export async function mockNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
  if (isDevelopment) {
    console.log(`[${type.toUpperCase()}] ${message}`);
    return true;
  }
  return false;
}

// 開発用のダミー決済処理
export function createMockStripeCheckout() {
  return {
    url: `/mock-checkout?return_url=${encodeURIComponent(window.location.origin + '/dashboard/success')}`
  };
}

// モックデータの取得
export async function getSampleData() {
  return {
    organization: SAMPLE_ORGANIZATION,
    services: SAMPLE_SERVICES,
    faqs: SAMPLE_FAQS,
    caseStudies: SAMPLE_CASE_STUDIES
  };
}