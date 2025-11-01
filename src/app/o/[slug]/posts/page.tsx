import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { generateOrganizationJsonLd } from '@/lib/utils/jsonld';
import type { Organization, Post } from '@/types/database';
import { logger } from '@/lib/utils/logger';

interface PostsPageData {
  organization: Organization;
  posts: Post[];
}

async function getPostsData(slug: string): Promise<PostsPageData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/public/organizations/${slug}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return null;
    }
    
    const result = await response.json();
    return {
      organization: result.data.organization,
      posts: result.data.posts || []
    };
  } catch (error) {
    logger.error('Failed to fetch posts data', error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getPostsData(resolvedParams.slug);

  if (!data) {
    return {
      title: 'Posts Not Found',
    };
  }

  const { organization } = data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    title: `記事一覧 | ${organization.name}`,
    description: `${organization.name}が発信する記事・ブログ一覧です。最新情報やお役立ち情報をお届けします。`,
    openGraph: {
      title: `${organization.name} - 記事一覧`,
      description: `${organization.name}の記事・ブログ一覧`,
      type: 'website',
      url: `${baseUrl}/o/${organization.slug}/posts`,
      siteName: organization.name,
      images: organization.logo_url ? [{
        url: organization.logo_url,
        width: 1200,
        height: 630,
        alt: `${organization.name} logo`,
      }] : undefined,
    },
    alternates: {
      canonical: `/o/${organization.slug}/posts`,
    },
  };
}

export default async function PostsPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = await params;
  const data = await getPostsData(resolvedParams.slug);

  if (!data) {
    notFound();
  }

  const { organization, posts } = data;
  
  // JSON-LD構造化データ生成
  const jsonLdArray = [];
  
  // 組織情報
  jsonLdArray.push(generateOrganizationJsonLd(organization));
  
  // Blog ListItem JSON-LD（記事一覧用）
  if (posts.length > 0) {
    const blogJsonLd = {
      "@context": "https://schema.org",
      "@type": "Blog",
      "@id": `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/o/${organization.slug}/posts`,
      "url": `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/o/${organization.slug}/posts`,
      "name": `${organization.name} - 記事・ブログ`,
      "description": `${organization.name}が発信する記事・ブログ一覧`,
      "publisher": {
        "@type": "Organization",
        "@id": `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/o/${organization.slug}`,
        "name": organization.name
      },
      "blogPost": posts.map(post => ({
        "@type": "BlogPosting",
        "@id": `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/o/${organization.slug}/posts/${post.id}`,
        "url": `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/o/${organization.slug}/posts/${post.id}`,
        "headline": post.title,
        "datePublished": post.published_at || post.created_at,
        "dateModified": post.updated_at,
        "author": {
          "@type": "Organization",
          "name": organization.name
        }
      }))
    };
    jsonLdArray.push(blogJsonLd);
  }

  return (
    <>
      {/* JSON-LD structured data */}
      {jsonLdArray.map((jsonLd, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ))}

      <div className="min-h-screen bg-gray-50">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-[var(--aio-primary)]">
                  AIO Hub AI企業CMS
                </Link>
                <nav className="ml-10 hidden md:flex space-x-8">
                  <Link href="/organizations" className="text-gray-500 hover:text-gray-700">
                    企業ディレクトリ
                  </Link>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/login" className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                  ログイン
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* パンくずナビ */}
          <nav className="flex mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/" className="text-gray-500 hover:text-gray-700">
                  ホーム
                </Link>
              </li>
              <li>
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <Link href={`/o/${organization.slug}`} className="text-gray-500 hover:text-gray-700">
                  {organization.name}
                </Link>
              </li>
              <li>
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <span className="text-gray-900 font-medium">記事一覧</span>
              </li>
            </ol>
          </nav>

          {/* ページタイトル */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {organization.name} - 記事一覧
            </h1>
            <p className="text-lg text-gray-600">
              最新情報やお役立ち情報をお届けします
            </p>
          </div>

          {/* 記事一覧 */}
          {posts && posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/o/${organization.slug}/posts/${post.id}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:border-blue-300 transition-all"
                >
                  
                  <div className="p-6">

                    {/* タイトル */}
                    <h2 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                      {post.title}
                    </h2>


                    {/* メタ情報 */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          {new Date(post.published_at || post.created_at).toLocaleDateString('ja-JP')}
                        </span>
                      </div>

                      <span className={`px-2 py-1 rounded-full text-xs ${
                        post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {post.status === 'published' ? '公開中' : '下書き'}
                      </span>
                    </div>


                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <span className="text-[var(--aio-primary)] text-sm font-medium">
                        続きを読む →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  記事はまだ公開されていません
                </h3>
                <p className="text-gray-600">
                  現在準備中です。しばらくお待ちください。
                </p>
              </div>
            </div>
          )}

          {/* ページネーション（将来実装用） */}
          {posts && posts.length > 0 && (
            <div className="mt-12 text-center">
              <div className="text-sm text-gray-500">
                {posts.length}件の記事を表示中
              </div>
            </div>
          )}

          {/* 企業情報に戻るリンク */}
          <div className="mt-12 text-center">
            <Link 
              href={`/o/${organization.slug}`}
              className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              {organization.name} トップページに戻る
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}