// /aio ページのコピー定数

export const aioCopy = {
  // Stage (舞台)
  stage: {
    title: 'AIO（AI Information Optimization）とは',
    description: 'AIが情報を理解・引用しやすい形に整える考え方。AIO Hubはこの実践を、誰でも扱えるフォーム入力で実現します。',
  },

  // Characters (登場人物)
  characters: {
    title: 'AIOを支える3者',
    items: [
      '企業：事実情報を継続更新',
      'プラットフォーム（AIO Hub）：構造化・公開・最適化を担保',
      'AI/検索：構造化情報を参照し、回答の中に要約/引用',
    ],
  },

  // Conflict (衝突)
  conflict: {
    title: '"情報はある"のに、AIに届かない',
    items: [
      '形式がバラバラ/更新負荷が高い',
      'JSON-LDやセマンティックHTMLの整備コスト',
      '結果として、AIの回答に企業が登場しづらい',
    ],
  },

  // BigIdea (ビッグアイデア)
  bigIdea: {
    title: '"AIOを標準装備"した企業ディレクトリ',
    description: 'AIO Hub上で企業が集まるほど、全体のドメインパワーが強化。個社にとっても"引用される確率"が上がります。',
  },

  // Solution (解決策)
  solution: {
    title: 'AIO Hubが提供すること',
    items: [
      '構造化データ（JSON-LD）/見出し構造の自動整備',
      '公開/非公開・スラッグ・OGPなどの基本運用',
      '無料：ロゴ/サービス1件。有料：複数サービスや外部CTAなど',
    ],
    note: '閲覧レポート/マッチングは（予定）。実装後に提供します。',
  },

  // Recap (再主張)
  recap: {
    title: '"選ばれない理由"を、構造から解消',
    description: '情報を"AIが読める"形にしておく。それがAIOです。',
  },

  // ClosingCTA (CTA)
  closingCTA: {
    title: 'AIOを、今から',
    primaryText: '無料で始める',
    primaryHref: '/organizations',
    secondaryText: 'サービス概要',
    secondaryHref: '/service',
  },

  // メタデータ
  metadata: {
    title: 'AIOとは - AIO Hub',
    description: 'AIO（AI Information Optimization）はAIが情報を理解・引用しやすい形に整える考え方。AIO Hubで企業情報のAIO対策を始めましょう。',
  },
} as const;