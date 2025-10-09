// AIO Hub とは ページのコピー定数

export const aioCopy = {
  // Stage (舞台)
  stage: {
    title: 'AIO Hubとは',
    description: 'AIが情報を理解・引用しやすい形に整える「AIO（AI Information Optimization）」を、誰でも扱えるフォーム入力で実現するプラットフォーム。',
  },

  // Characters (課題提示 - ゼロクリック時代)
  characters: {
    title: 'ゼロクリック時代の到来',
    items: [
      'ユーザーはChatGPTやGeminiに「調べてもらう」のが当たり前に',
      'AIは構造化された情報を優先的に引用・参照',
      '従来のWebサイトだけでは、AI回答に企業が登場しづらい状況',
    ],
  },

  // Conflict (解決策 - 情報最適化)
  conflict: {
    title: 'AIO Hubによる情報最適化',
    items: [
      '企業情報をAIが理解しやすい構造化データ（JSON-LD）に自動変換',
      'フォーム入力だけで、専門知識不要でAI最適化を実現',
      'ディレクトリ効果により、個社の検索ランキングも向上',
    ],
  },

  // BigIdea (仕組み - JSON-LD自動生成)
  bigIdea: {
    title: 'JSON-LD自動生成システム',
    description: '企業情報をフォーム入力するだけで、AIが理解できる構造化データ（JSON-LD）を自動生成。手動作業不要で、専門知識なしでもAI最適化を実現。',
  },

  // Solution (成果 - ディレクトリ効果)
  solution: {
    title: 'ディレクトリ効果による相乗効果',
    items: [
      'AIO Hub上に企業が集まることで、全体のドメインパワーが強化',
      '個社にとっても「AI回答に引用される確率」が向上',
      '構造化データの品質向上により、検索ランキングも上昇',
    ],
    note: 'プラットフォーム全体の信頼性向上が、参加企業全体にメリットをもたらします。',
  },

  // Recap (料金プラン)
  recap: {
    title: '始めやすい料金プラン',
    description: '基本機能は無料。企業ロゴとサービス1件まで登録可能。より多くのサービスや高度な機能は有料プランで。',
  },

  // ClosingCTA (CTA - 無料で始める)
  closingCTA: {
    title: 'AI時代の企業情報管理を、今すぐ',
    primaryText: '無料で始める',
    primaryHref: '/organizations',
    secondaryText: 'ヒアリング代行サービス',
    secondaryHref: '/hearing-service',
  },

  // メタデータ
  metadata: {
    title: 'AIO Hubとは | AI情報最適化CMS',
    description: 'AIO Hub は企業情報をAIが理解しやすい形に最適化するプラットフォーム。JSON-LD自動生成で、ChatGPTやGeminiの回答に企業が引用されやすくなります。',
  },
} as const;