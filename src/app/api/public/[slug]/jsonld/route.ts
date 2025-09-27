// 診断用JSON-LDエンドポイント: /api/public/[slug]/jsonld
// 実際にページで出力するJSON-LDをそのまま返す（デバッグ・検証用）
import { NextRequest, NextResponse } from 'next/server';
import { 
  generateOrganizationJsonLd, 
  generateServiceJsonLd,
  generateCaseStudyJsonLd,
  generateFAQJsonLd,
  generatePostJsonLd
} from '@/lib/utils/jsonld';

export const dynamic = 'force-dynamic';

async function getOrganizationData(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/public/organizations/${slug}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return null;
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Failed to fetch organization data:', error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    // 企業データを取得
    const data = await getOrganizationData(resolvedParams.slug);
    
    if (!data || !data.organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const { organization, posts, services, case_studies, faqs } = data;

    // タイプに応じてJSON-LDを生成
    switch (type) {
      case 'organization': {
        const jsonLd = generateOrganizationJsonLd(organization);
        return NextResponse.json(jsonLd);
      }

      case 'service': {
        if (!id) {
          return NextResponse.json(
            { error: 'Service ID is required' },
            { status: 400 }
          );
        }
        
        const service = services?.find((s: any) => s.id === id);
        if (!service) {
          return NextResponse.json(
            { error: 'Service not found' },
            { status: 404 }
          );
        }
        
        const jsonLd = generateServiceJsonLd(service, organization);
        return NextResponse.json(jsonLd);
      }

      case 'services': {
        // 全サービスのJSON-LD配列
        if (!services || services.length === 0) {
          return NextResponse.json([]);
        }
        
        const jsonLdArray = services.map((service: any) => 
          generateServiceJsonLd(service, organization)
        );
        return NextResponse.json(jsonLdArray);
      }

      case 'case-study': {
        if (!id) {
          return NextResponse.json(
            { error: 'Case study ID is required' },
            { status: 400 }
          );
        }
        
        const caseStudy = case_studies?.find((cs: any) => cs.id === id);
        if (!caseStudy) {
          return NextResponse.json(
            { error: 'Case study not found' },
            { status: 404 }
          );
        }
        
        const jsonLd = generateCaseStudyJsonLd(caseStudy, organization);
        return NextResponse.json(jsonLd);
      }

      case 'case-studies': {
        // 全事例のJSON-LD配列
        if (!case_studies || case_studies.length === 0) {
          return NextResponse.json([]);
        }
        
        const jsonLdArray = case_studies.map((caseStudy: any) => 
          generateCaseStudyJsonLd(caseStudy, organization)
        );
        return NextResponse.json(jsonLdArray);
      }

      case 'faq': 
      case 'faqs': {
        if (!faqs || faqs.length === 0) {
          return NextResponse.json(null);
        }
        
        const jsonLd = generateFAQJsonLd(faqs);
        return NextResponse.json(jsonLd);
      }

      case 'post': {
        if (!id) {
          return NextResponse.json(
            { error: 'Post ID is required' },
            { status: 400 }
          );
        }
        
        const post = posts?.find((p: any) => p.id === id);
        if (!post) {
          return NextResponse.json(
            { error: 'Post not found' },
            { status: 404 }
          );
        }
        
        const jsonLd = generatePostJsonLd(post, organization);
        return NextResponse.json(jsonLd);
      }

      case 'posts': {
        // 全記事のJSON-LD配列（Blog形式）
        if (!posts || posts.length === 0) {
          return NextResponse.json(null);
        }
        
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
          "blogPost": posts.map((post: any) => generatePostJsonLd(post, organization))
        };
        return NextResponse.json(blogJsonLd);
      }

      case 'all': {
        // 全体のJSON-LD配列（企業ページで使用されるもの）
        const jsonLdArray = [];
        
        // 組織情報
        jsonLdArray.push(generateOrganizationJsonLd(organization));
        
        // Website構造
        if ((posts && posts.length > 0) || (services && services.length > 0) || (case_studies && case_studies.length > 0)) {
          const websiteJsonLd = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/o/${organization.slug}#website`,
            "url": `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/o/${organization.slug}`,
            "name": `${organization.name} - 企業情報`,
            "publisher": {
              "@type": "Organization",
              "@id": `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/o/${organization.slug}`,
              "name": organization.name
            }
          };
          jsonLdArray.push(websiteJsonLd);
        }
        
        // FAQ
        if (faqs && faqs.length > 0) {
          const faqJsonLd = generateFAQJsonLd(faqs);
          if (faqJsonLd) {
            jsonLdArray.push(faqJsonLd);
          }
        }
        
        return NextResponse.json(jsonLdArray);
      }

      default: {
        return NextResponse.json(
          { 
            error: 'Invalid type parameter', 
            validTypes: ['organization', 'service', 'services', 'case-study', 'case-studies', 'faq', 'faqs', 'post', 'posts', 'all'],
            usage: 'GET /api/public/[slug]/jsonld?type=organization|service&id=xxx'
          },
          { status: 400 }
        );
      }
    }

  } catch (error) {
    console.error('Failed to generate JSON-LD:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}