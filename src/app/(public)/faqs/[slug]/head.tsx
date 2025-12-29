/**
 * FAQ詳細ページの Head コンポーネント
 * - hreflang と canonical の補強
 * - 多言語対応の alternate リンク出力
 * - サーバーサイドでのSupabase取得（SERVICE_ROLE_KEY使用）
 */

import React from 'react';
import { createClient } from '@supabase/supabase-js';

// サーバーサイド専用のSupabaseクライアント
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-only usage
);

export default async function Head(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const site = 'https://aiohub.jp';
  const canonical = `${site}/faqs/${slug}`;

  const { data: rows, error } = await supabase
    .from('v_faqs_published')
    .select('slug, lang')
    .eq('slug', slug);

  if (error) {
    // エラー時も canonical のみは出力
    return (
      <>
        <link rel="canonical" href={canonical} />
        <link rel="alternate" hrefLang="x-default" href={canonical} />
      </>
    );
  }

  const alternates = (rows ?? []).map(r => ({
    lang: r.lang,
    href: r.lang === 'ja'
      ? canonical
      : `${site}/${r.lang}/faqs/${slug}`,
  }));

  return (
    <>
      <link rel="canonical" href={canonical} />
      {alternates.map(a => (
        <link key={a.lang} rel="alternate" hrefLang={a.lang} href={a.href} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={canonical} />
    </>
  );
}