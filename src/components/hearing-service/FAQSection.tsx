'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const faqData = [
  {
    question: 'ヒアリングではどのような内容を聞かれますか？',
    answer: '主に以下の内容についてお聞きします：\n\n• 事業概要・主力サービスの詳細\n• ターゲット顧客層・市場の特徴\n• 競合他社との差別化ポイント\n• 具体的な導入事例・成功実績\n• 料金体系・提供プロセス\n• 会社の強み・独自の技術\n\n専門スタッフが丁寧にヒアリングしますので、難しい準備は不要です。普段お客様にお話しされている内容で十分です。',
    category: 'process'
  },
  {
    question: 'オンラインでの対応は可能ですか？',
    answer: 'はい、オンラインでの対応も可能です。\n\n対応方法：\n• Zoom、Teams、Google Meetなど主要ツール対応\n• 全国どこからでも参加可能\n• 画面共有で資料を確認しながら進行\n• 録画も可能（ご希望の場合）\n\nもちろん対面でのヒアリングも承っておりますので、ご都合の良い方法をお選びください。',
    category: 'process'
  },
  {
    question: '申し込みから公開まではどれくらいの期間がかかりますか？',
    answer: '通常以下のスケジュールで進行します：\n\nシングルヒアリングの場合：\n• 申し込み〜ヒアリング実施：3-5営業日\n• ヒアリング〜構造化作業：5-7営業日\n• 構造化〜CMS公開：2-3営業日\n• 合計：約2-3週間\n\n継続支援プランの場合：\n• 初回は上記と同様\n• 月次更新は実施から1週間以内\n\n繁忙期や内容の複雑さにより前後する場合がございます。',
    category: 'timeline'
  },
  {
    question: 'どのような業界・規模の企業が対象ですか？',
    answer: '幅広い業界・規模の企業様にご利用いただけます。\n\n対象業界（実績例）：\n• IT・ソフトウェア\n• 製造業・メーカー\n• 小売・EC\n• サービス業・コンサルティング\n• 医療・ヘルスケア\n• 教育・研修\n\n企業規模：\n• スタートアップ〜大企業まで\n• 従業員数1名〜1000名以上\n• 特に中小企業の皆様に好評\n\nBtoB、BtoC問わずお任せください。',
    category: 'target'
  },
  {
    question: '既存のホームページやパンフレットがない場合でも対応可能ですか？',
    answer: 'はい、全く問題ございません。\n\nむしろ以下のメリットがあります：\n• 既存の情報に縛られない自由な構造化\n• 最初からAI最適化を前提とした設計\n• お客様の頭の中にある情報を整理\n\n必要な情報：\n• 事業内容（口頭説明で十分）\n• 主要なお客様・取引先\n• 提供している商品・サービス\n• 会社の特徴・強み\n\n名刺や簡単な会社案内があれば十分です。ヒアリングを通じて一緒に整理させていただきます。',
    category: 'requirement'
  },
  {
    question: '成果物や効果はどのように確認できますか？',
    answer: '以下の方法で成果を確認いただけます：\n\n提供物：\n• 構造化された企業情報データ\n• CMS管理画面へのアクセス\n• SEO最適化レポート\n• Before/After比較資料\n\n効果測定：\n• 検索順位の改善状況\n• アクセス数・問い合わせ数の変化\n• AI検索での発見性向上\n• 競合比較での優位性\n\n継続プランでは月次レポートで詳細な分析結果をお届けします。',
    category: 'result'
  },
  {
    question: '追加料金が発生する場合はありますか？',
    answer: '基本的には表示料金以外の追加費用は発生しません。\n\n追加料金が発生する場合：\n• 大幅なサービス追加（事前相談）\n• 60分を大幅に超過するヒアリング\n• 特別な技術的要件\n• 緊急対応（通常より早い納期）\n\n事前確認：\n• 追加作業は必ず事前にお見積もり\n• お客様の承認後に実施\n• 不明な点は契約前にご確認\n\n安心してご利用いただけるよう、透明性の高い料金体系を心がけています。',
    category: 'pricing'
  },
  {
    question: 'ヒアリング後にキャンセルは可能ですか？',
    answer: 'ヒアリング実施後のキャンセルについて：\n\nシングルヒアリング：\n• ヒアリング実施後のキャンセル不可\n• 成果物に満足いただけない場合は修正対応\n• 明らかな不備がある場合は再実施\n\n継続支援プラン：\n• 初回ヒアリング後、1ヶ月以内なら50%返金\n• 月次契約のため翌月からの解約可能\n• 解約手数料は不要\n\nご不安な点は契約前にお気軽にご相談ください。',
    category: 'policy'
  }
];

const categories = [
  { id: 'all', label: 'すべて' },
  { id: 'process', label: 'プロセス' },
  { id: 'timeline', label: 'スケジュール' },
  { id: 'target', label: '対象・要件' },
  { id: 'result', label: '成果・効果' },
  { id: 'pricing', label: '料金' },
  { id: 'policy', label: '契約・キャンセル' }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredFAQs = activeCategory === 'all' 
    ? faqData 
    : faqData.filter(faq => faq.category === activeCategory);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* セクションヘッダー */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-4">
            <HelpCircle className="w-4 h-4" />
            <span>よくある質問</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            お客様からよくいただくご質問
          </h2>
          <p className="text-xl text-gray-600">
            ご不明な点がございましたら、お気軽にお問い合わせください。
          </p>
        </div>

        {/* カテゴリフィルター */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === category.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* FAQ リスト */}
        <div className="space-y-4">
          {filteredFAQs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all duration-300"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-4">
                  {faq.question}
                </h3>
                <div className="flex-shrink-0">
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-5 border-t border-gray-100">
                  <div className="pt-4 text-gray-700 leading-relaxed whitespace-pre-line">
                    {faq.answer}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 追加サポート */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              他にもご質問がございますか？
            </h3>
            <p className="text-gray-600 mb-6">
              お気軽にお問い合わせください。専門スタッフが丁寧にお答えします。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@luxucare.jp"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                メールで問い合わせ
              </a>
              <a
                href="tel:03-1234-5678"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                電話で問い合わせ
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}