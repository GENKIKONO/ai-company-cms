/**
 * FAQ詳細ページ (App Router)
 * - Supabase Service Role Key でサーバーサイド取得
 * - JSON-LD構造化データ埋め込み
 * - Meta設定とOpenGraph対応
 */

import { Metadata } from 'next';
import { buildFaqJsonLd } from '@/lib/jsonld';
import { createClient } from '@supabase/supabase-js';

// サーバーサイド専用のSupabaseクライアント
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-only usage
);

type FaqRow = {
  id: string;
  slug: string;
  base_path: string | null;
  organization_id: string | null;
  base_locale: string | null;
  is_published: boolean;
  updated_at: string | null;
  lang: string;
  question: string;
  answer_html: string | null;
  answer_plain: string | null;
  published_at: string | null;
};

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const { data: rows } = await supabase
    .from('v_faqs_published')
    .select('slug, lang, question, updated_at, base_path')
    .eq('slug', slug);

  const site = 'https://aiohub.jp';
  const canonical = `${site}/faqs/${slug}`;

  // 言語別の代替URL生成
  const languages: Record<string, string> = {};
  if (rows && rows.length > 0) {
    for (const row of rows) {
      const lang = row.lang;
      const href = lang === 'ja' 
        ? canonical 
        : `${site}/${lang}/faqs/${slug}`;
      languages[lang] = href;
    }
  } else {
    languages.ja = canonical;
  }

  const preferredRow = rows?.find(r => r.lang === 'ja') ?? rows?.[0];

  return {
    title: preferredRow?.question ?? 'FAQ',
    description: `${preferredRow?.question ?? 'FAQ'} - AIOHub`,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      url: canonical,
      title: preferredRow?.question ?? 'FAQ',
      type: 'article',
      siteName: 'AIOHub',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function FaqPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { data: rows, error } = await supabase
    .from('v_faqs_published')
    .select('id, organization_id, question, answer, answer_html, answer_plain, slug, lang, category, display_order, created_at, updated_at')
    .eq('slug', slug);

  if (error || !rows || rows.length === 0) {
    return <div>Not found</div>;
  }

  // 多言語のうち ja を優先
  const preferred = rows.find(r => r.lang === 'ja') ?? rows[0];
  const site = 'https://aiohub.jp';
  const url = `${site}/faqs/${preferred.slug}`;

  const jsonLd = buildFaqJsonLd({
    url,
    title: preferred.question,
    question: preferred.question,
    answerHtml: preferred.answer_html ?? undefined,
    answerPlain: preferred.answer_plain ?? undefined,
    inLanguage: preferred.lang,
    dateModified: preferred.updated_at ?? undefined,
    publisher: { name: 'AIOHub', url: site },
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {preferred.question}
          </h1>
        </header>
        <div className="prose prose-lg max-w-none">
          {preferred.answer_html ? (
            <div dangerouslySetInnerHTML={{ __html: preferred.answer_html }} />
          ) : (
            <p className="text-gray-700 leading-relaxed">
              {preferred.answer_plain}
            </p>
          )}
        </div>
      </article>
    </>
  );
}