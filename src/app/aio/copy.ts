// /aio ページのコピー定数（LP構造対応）

export const aioCopy = {
  // Hero Section
  hero: {
    title: 'AIと検索エンジンが解釈しやすい形で\n企業情報を構造化・整備します',
    subtitle: 'AIO（AI Information Optimization）',
    description: 'Schema.orgに準拠したJSON-LD を生成し、情報の解釈を支援します。CMS管理で企業情報の構造化・整備を行います。',
    features: [
      { icon: 'Database', text: 'JSON-LD自動生成' },
      { icon: 'Search', text: 'AI理解支援' },
      { icon: 'Zap', text: '構造化データ出力' }
    ],
    benefits: [
      { 
        title: 'JSON-LD自動生成', 
        description: '入力データからSchema.org準拠の構造化データを自動生成します。' 
      },
      { 
        title: 'AI理解支援', 
        description: '検索エンジンやAIが解釈しやすい情報構造の準備を支援します。' 
      },
      { 
        title: 'CMS一元管理', 
        description: '会社・サービス・実績・FAQをまとめて管理。公開/非公開も簡単。' 
      },
      { 
        title: '無料で開始', 
        description: '会社ロゴとサービス画像1枚から。必要に応じて機能拡張が可能。' 
      }
    ]
  },

  // Flow Section - JSON-LD生成プロセス
  flow: {
    title: 'シンプルな3ステップで\nAI最適化を実現',
    description: 'フォーム入力だけで、企業情報が自動的にJSON-LDとして構造化。\n技術知識不要でAI時代の情報発信が始められます。',
    steps: [
      {
        step: 1,
        title: '企業情報入力',
        description: '直感的なフォームで基本情報・サービス・実績を入力するだけ。',
        details: [
          '会社概要・沿革・理念',
          'サービス詳細・料金・特徴',
          '導入事例・実績・認定資格'
        ],
        color: 'blue'
      },
      {
        step: 2,
        title: 'JSON-LD自動生成',
        description: 'Schema.orgに準拠した構造化データを自動生成・最適化。',
        details: [
          'Organization・Service・Offer構造',
          'セマンティックHTMLとの連携',
          'AI理解に最適化された項目設計'
        ],
        color: 'purple'
      },
      {
        step: 3,
        title: '公開・運用開始',
        description: 'Schema.org準拠の構造化データ出力などの技術対応を実施します。',
        details: [
          '検索エンジン・AI向けサイトマップ',
          'JSON-LD構造化データ自動生成',
          'リアルタイム更新・バージョン管理'
        ],
        color: 'indigo'
      }
    ],
    beforeAfter: {
      title: 'Before → After: 情報構造の変化',
      description: 'バラバラな情報がAI理解に最適な構造に変わります',
      before: {
        title: '従来の情報発信',
        items: [
          '"総合的なITソリューションを提供..."',
          '"お客様のニーズに合わせたサービス..."',
          '"高品質で安心・安全なシステム..."'
        ],
        problem: '抽象的でAIが理解困難'
      },
      after: {
        title: 'AIO対応後',
        items: [
          '{ "@type": "Service", "name": "ECサイト構築", "priceRange": "月額5万円〜" }',
          '{ "targetIndustry": ["製造業", "小売業"], "customerSize": "中小企業" }',
          '{ "serviceOutput": { "metric": "売上向上", "value": "実績あり" } }'
        ],
        benefit: 'AI・検索エンジンが解釈しやすい構造'
      }
    }
  },

  // Pricing Section
  pricing: {
    title: 'シンプルで明確な料金体系',
    description: 'まずは無料でAIOの効果を実感。本格運用は月額5,000円から始められます。',
    plans: [
      {
        name: 'Free',
        description: 'AIOの基本機能を体験',
        price: '0',
        period: '永続無料',
        icon: 'Star',
        popular: false,
        features: [
          '企業ロゴ・基本情報の登録',
          '主力サービス1件の詳細登録',
          'Q&A項目：5件まで',
          'JSON-LD自動生成・公開',
          '基本的なSEO最適化',
          'Hub内構造化のみ（自社サイト埋め込み不可）'
        ],
        limitations: [
          '登録サービス数は1件まで',
          '外部CTA・問い合わせフォーム連携なし'
        ],
        color: 'blue',
        buttonText: '無料で始める'
      },
      {
        name: 'Basic',
        description: '基本的なAI最適化運用',
        price: '5,000',
        period: '月額',
        icon: 'Zap',
        popular: false,
        features: [
          'Freeプランの全機能',
          'サービス登録：10件まで',
          'Q&A項目：20件まで',
          'Hub＋自社サイト埋め込み対応',
          '営業資料添付（最大5個）',
          '外部リンク表示機能',
          'カテゴリタグ検索対応',
          'メールサポート'
        ],
        limitations: [],
        color: 'green',
        buttonText: 'Basicプランを選択'
      },
      {
        name: 'Business',
        description: '本格的なAI最適化運用',
        price: '15,000',
        period: '月額',
        icon: 'Crown',
        popular: true,
        features: [
          'Basicプランの全機能',
          'サービス登録：50件まで',
          'Q&A項目：無制限',
          '営業資料添付（最大20個）',
          'Verified法人バッジ',
          '承認フロー機能',
          '認証バッジ機能',
          'AI解析レポート（基本版）',
          'システム監視機能',
          '優先サポート・個別相談'
        ],
        limitations: [],
        color: 'purple',
        buttonText: 'Businessプランを選択'
      },
      {
        name: 'Enterprise',
        description: 'エンタープライズ向け完全運用',
        price: '30,000',
        period: '月額〜',
        icon: 'Building',
        popular: false,
        features: [
          'Businessプランの全機能',
          'すべての機能無制限',
          'SVG対応大サイズロゴ',
          'AI解析レポート（拡張版）',
          'カスタム機能開発',
          '専任サポート',
          'SLA保証',
          'ホワイトラベル対応'
        ],
        limitations: [],
        color: 'indigo',
        buttonText: 'お問い合わせ'
      }
    ],
    notes: {
      included: [
        '消費税込みの価格表示',
        '初期費用・セットアップ費用無料',
        'JSON-LD・Schema.org準拠対応',
        'デザイン・レスポンシブ対応'
      ],
      payment: [
        'クレジットカード・銀行振込対応',
        'いつでもプラン変更・解約可能',
        '年間契約で10%割引適用',
        '30日間返金保証'
      ]
    }
  },

  // FAQ Section
  faq: {
    title: 'よくあるご質問',
    description: 'AIO・JSON-LD・構造化データに関する技術的な質問にお答えします。',
    categories: [
      {
        title: 'AIO・基本概念',
        items: [
          {
            question: 'AIO（AI Information Optimization）とは何ですか？',
            answer: 'AIが情報を理解・引用しやすい形に整える考え方です。JSON-LDによる構造化データ、セマンティックHTML、メタデータ最適化を通じて、AI検索・生成AI・音声アシスタントから正確に参照される情報環境を構築します。'
          },
          {
            question: 'なぜ今AIOが必要なのですか？',
            answer: 'ゼロクリック検索の普及により、AIが直接回答を生成する機会が急増。従来のSEOだけでは不十分で、AIが理解しやすい構造化された情報提供が企業の発見性向上に不可欠になっています。'
          }
        ]
      },
      {
        title: 'JSON-LD・技術仕様',
        items: [
          {
            question: 'JSON-LDとは何ですか？',
            answer: 'Linked Dataを表現するJSON形式のフォーマット。Schema.orgの語彙を使用して、企業情報・サービス・イベントなどを機械が理解できる形で構造化します。GoogleやBingなどの検索エンジンが推奨する標準仕様です。'
          },
          {
            question: '自社サイトにJSON-LDを設置する必要がありますか？',
            answer: 'いいえ。AIO HubではホストされたページとしてJSON-LDが自動生成・公開されます。自社サイトへの技術的な変更は不要で、既存サイトとの連携も可能です。'
          }
        ]
      },
      {
        title: 'プラン・機能',
        items: [
          {
            question: 'フリープランでも効果はありますか？',
            answer: 'はい。基本的なJSON-LD生成・SEO最適化により、主力サービス1件の検索性向上を実感いただけます。本格運用にはスタンダードプランでの複数サービス登録を推奨します。'
          },
          {
            question: 'データの更新頻度はどの程度ですか？',
            answer: 'リアルタイム更新に対応。フォームでの情報変更が即座にJSON-LD・メタデータ・サイトマップに反映され、検索エンジンとAIプラットフォームへの情報提供が自動化されます。'
          }
        ]
      }
    ]
  },

  // CTA Section
  cta: {
    title: 'AIOで、今すぐ始める\n企業情報の構造化',
    description: 'フリープランなら永続無料。5分の入力で、あなたの企業情報の構造化を開始できます。',
    primaryText: '無料でAIOを始める',
    primaryHref: '/organizations',
    secondaryText: 'ヒアリング代行を利用する',
    secondaryHref: '/hearing-service',
    features: [
      'クレジットカード登録不要',
      'いつでもプラン変更可能',
      'JSON-LD・Schema.org準拠対応'
    ],
    disclaimer: '本サービスは、構造化データの出力など技術的支援を提供するものであり、検索順位や掲載・引用の結果を保証するものではありません。'
  },

  // メタデータ
  metadata: {
    title: 'AIOとは - AI情報構造化で検索エンジン理解を支援 | AIO Hub',
    description: 'AIO（AI Information Optimization）で企業情報を構造化。JSON-LD自動生成とCMS管理で、検索エンジンやAIが解釈しやすい形での情報整備を支援。フリープラン永続無料。',
  },
} as const;