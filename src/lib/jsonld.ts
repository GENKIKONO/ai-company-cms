/**
 * JSON-LD構造化データビルダーとHTMLユーティリティ
 * FAQ ページ用の Schema.org 構造化データを生成
 */

/**
 * HTML文字列からタグを除去してプレーンテキストに変換
 */
export function stripHtml(html: string): string {
  return (html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * FAQPage用のJSON-LD構造化データを生成
 */
export function buildFaqJsonLd(params: {
  url: string;
  title: string;
  question: string;
  answerHtml?: string;
  answerPlain?: string;
  inLanguage: string;
  dateModified?: string;
  publisher?: { 
    name: string; 
    logoUrl?: string; 
    url?: string;
  };
}) {
  // answer_plain を優先、なければ answer_html をストリップ
  const textAnswer =
    (params.answerPlain && params.answerPlain.trim().length > 0)
      ? params.answerPlain
      : stripHtml(params.answerHtml || '');

  const data: any = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: params.question,
        acceptedAnswer: { 
          '@type': 'Answer', 
          text: textAnswer 
        },
      },
    ],
    inLanguage: params.inLanguage || 'ja',
    url: params.url,
    headline: params.title,
  };

  if (params.dateModified) {
    data.dateModified = params.dateModified;
  }

  if (params.publisher) {
    data.publisher = {
      '@type': 'Organization',
      name: params.publisher.name,
      ...(params.publisher.url ? { url: params.publisher.url } : {}),
      ...(params.publisher.logoUrl
        ? { 
            logo: { 
              '@type': 'ImageObject', 
              url: params.publisher.logoUrl 
            } 
          }
        : {}),
    };
  }

  return data;
}