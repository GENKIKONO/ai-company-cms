import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CalendarIcon, UserIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { markdownToHtml, truncateMarkdown } from '@/lib/markdown';
import { JsonLdModal } from '@/components/ui/json-ld-modal';
import { LogoImage } from '@/components/ui/optimized-image';

interface Post {
  id: string;
  title: string;
  body: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    url: string | null;
    logo_url: string | null;
    status: string;
  } | null;
  author: {
    id: string;
    name: string;
  } | null;
}

async function getPost(slug: string, postId: string, isPreview: boolean = false): Promise<Post | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = new URL(`${baseUrl}/api/public/o/${slug}/posts/${postId}`);
    if (isPreview) {
      url.searchParams.set('preview', 'true');
    }
    
    const response = await fetch(url.toString(), {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return null;
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Failed to fetch post:', error);
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string; id: string }> }
): Promise<Metadata> {
  const resolvedParams = await params;
  const post = await getPost(resolvedParams.slug, resolvedParams.id);

  if (!post || !post.organization) {
    return {
      title: 'Post Not Found',
    };
  }

  const publishedDate = post.published_at ? new Date(post.published_at).toISOString() : new Date(post.created_at).toISOString();

  const description = post.body ? truncateMarkdown(post.body, 160) : `${post.title} by ${post.organization.name}`;

  return {
    title: `${post.title} | ${post.organization.name}`,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      publishedTime: publishedDate,
      authors: [post.organization.name],
      siteName: post.organization.name,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
    },
    alternates: {
      canonical: `/o/${post.organization.slug}/posts/${post.id}`,
    },
  };
}

function generateArticleJsonLd(post: Post) {
  if (!post.organization) return null;

  const publishedDate = post.published_at ? new Date(post.published_at).toISOString() : new Date(post.created_at).toISOString();
  const modifiedDate = new Date(post.updated_at).toISOString();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const articleUrl = `${baseUrl}/o/${post.organization.slug}/posts/${post.id}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.body ? truncateMarkdown(post.body, 160) : post.title,
    image: post.organization.logo_url || `${baseUrl}/api/ogp/generate?title=${encodeURIComponent(post.title)}&org=${encodeURIComponent(post.organization.name)}`,
    datePublished: publishedDate,
    dateModified: modifiedDate,
    author: {
      '@type': 'Organization',
      name: post.organization.name,
      url: post.organization.url || `${baseUrl}/o/${post.organization.slug}`
    },
    publisher: {
      '@type': 'Organization',
      name: post.organization.name,
      logo: {
        '@type': 'ImageObject',
        url: post.organization.logo_url || `${baseUrl}/api/ogp/generate?title=${encodeURIComponent(post.organization.name)}&type=org`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl
    },
    url: articleUrl,
    articleBody: post.body || '',
    inLanguage: 'ja',
  };
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export default async function PostPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const isPreview = resolvedSearchParams.preview === 'true';
  
  const post = await getPost(resolvedParams.slug, resolvedParams.id, isPreview);

  if (!post || !post.organization) {
    notFound();
  }

  const jsonLd = generateArticleJsonLd(post);

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      
      <div className="min-h-screen bg-gray-50">
        {/* Preview Banner */}
        {isPreview && post.status === 'draft' && (
          <div className="bg-orange-500 text-white py-3 px-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="font-medium">プレビューモード</span>
                <span className="ml-2 text-orange-100">この記事は下書き状態です</span>
              </div>
              <div className="flex items-center space-x-2">
                {jsonLd && (
                  <JsonLdModal 
                    jsonLdData={[jsonLd]}
                    organizationName={post.organization?.name || 'Unknown'}
                    trigger={
                      <button className="inline-flex items-center px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded transition-colors">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        JSON-LD
                      </button>
                    }
                  />
                )}
                <Link
                  href={`/dashboard`}
                  className="inline-flex items-center px-3 py-1 bg-white text-orange-600 text-sm rounded hover:bg-orange-50 transition-colors"
                >
                  ダッシュボードに戻る
                </Link>
              </div>
            </div>
          </div>
        )}
        
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Navigation */}
          <div className="mb-8">
            <Link 
              href={`/o/${post.organization.slug}`}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              {post.organization.name} に戻る
            </Link>
          </div>

          {/* Organization Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center space-x-4">
              {post.organization.logo_url && (
                <LogoImage
                  src={post.organization.logo_url}
                  alt={post.organization.name}
                  size="lg"
                  organizationName={post.organization.name}
                />
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {post.organization.name}
                </h2>
                {post.organization.description && (
                  <p className="text-sm text-gray-600">
                    {post.organization.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Article Content */}
          <article className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Article Header */}
            <div className="px-6 py-8 border-b border-gray-200">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {post.title}
              </h1>
              
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span>
                    {post.published_at ? formatDate(post.published_at) : formatDate(post.created_at)}
                  </span>
                </div>
                
                {post.author && (
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    <span>{post.author.name}</span>
                  </div>
                )}
                
                {post.updated_at !== post.created_at && (
                  <div className="text-xs text-gray-400">
                    更新: {formatDate(post.updated_at)}
                  </div>
                )}
              </div>
            </div>

            {/* Article Body */}
            <div className="px-6 py-8">
              {post.body ? (
                <div 
                  className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline"
                  dangerouslySetInnerHTML={{ 
                    __html: markdownToHtml(post.body) 
                  }}
                />
              ) : (
                <div className="text-gray-500 italic">
                  この記事にはまだ内容が入力されていません。
                </div>
              )}
            </div>
          </article>

          {/* Footer */}
          <div className="mt-8 text-center">
            <Link
              href={`/o/${post.organization.slug}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {post.organization.name} の他の記事を見る
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}