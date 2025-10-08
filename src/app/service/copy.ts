// /service ページのコピー定数

export const serviceCopy = {
  // Stage (舞台)
  stage: {
    title: '検索しても"クリックしない"時代へ',
    description: 'ユーザーはChatGPTやGeminiなどのAIに"調べてもらう"のが当たり前に。AIは"引用できる構造の情報"を優先して参照します。従来の『検索→クリック→サイト閲覧』だけでは、存在に気づかれない場面が増えています。',
  },

  // Characters (登場人物)
  characters: {
    title: '情報を届けたい企業と、最短で答えを知りたいユーザー',
    items: [
      '企業：最新の会社情報・サービス情報を届けたい',
      'ユーザー：AIの回答内で信頼できる選択肢をすばやく比較したい',
      'AIO Hub：AIが読みやすい構造で企業情報を整える場',
    ],
  },

  // Conflict (衝突)
  conflict: {
    title: '"構造化"されていない情報は、選択肢から消える',
    items: [
      'AIは構造化されていない情報を拾いづらい（参照・要約しづらい）',
      'ホームページの更新は手間。情報が分散/陳腐化しがち',
      '結果、AIの回答に"あなたの会社"が登場しない＝機会損失',
    ],
  },

  // BigIdea (ビッグアイデア)
  bigIdea: {
    title: '"AIに読まれるかたち"で、企業情報をワンストップ管理',
    description: 'AIO Hubは、入力した企業データを"AI最適化済み"のページに自動整形。AIにも検索にも理解されやすい構造へ。',
  },

  // Solution (解決策)
  solution: {
    title: 'AIO対策を、フォーム入力だけで',
    items: [
      '企業プロファイル・サービス情報を入力→公開：AI最適化HTML+JSON-LDを自動生成',
      '無料で：会社ロゴ・サービス1件を公開/非公開管理',
      '有料で：複数サービス、CTA/営業資料リンクなどを拡張',
    ],
    note: 'レポート/企業間マッチングは（予定）。リリース次第ご案内します。',
  },

  // Recap (再主張)
  recap: {
    title: '"AIの回答の中"に、あなたの会社を',
    description: 'AIの選択肢から漏れないために。"読まれる構造"で今すぐ整備を。',
  },

  // ClosingCTA (CTA)
  closingCTA: {
    title: 'AIが企業を学習する時代、まずは存在を示そう',
    primaryText: '無料で始める',
    primaryHref: '/organizations',
    secondaryText: 'よくある質問',
    secondaryHref: '/faq',
  },

  // メタデータ
  metadata: {
    title: 'サービス概要 - AIO Hub',
    description: 'AIO HubはAIが理解しやすい構造で企業情報を管理・公開するプラットフォーム。検索しない時代に向けた企業のAIO対策を支援します。',
  },
} as const;