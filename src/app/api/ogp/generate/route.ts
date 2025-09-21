import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import sharp from 'sharp';

const OGP_WIDTH = 1200;
const OGP_HEIGHT = 630;

interface OGPGenerationOptions {
  companyName: string;
  description?: string;
  logoUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
}

// テンプレート定義
const OGP_TEMPLATE = `
<svg width="${OGP_WIDTH}" height="${OGP_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{{backgroundColor}};stop-opacity:1" />
      <stop offset="100%" style="stop-color:{{accentColor}};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 背景 -->
  <rect width="100%" height="100%" fill="url(#bgGradient)"/>
  
  <!-- オーバーレイ -->
  <rect width="100%" height="100%" fill="{{backgroundColor}}" fill-opacity="0.8"/>
  
  <!-- メインコンテンツエリア -->
  <rect x="80" y="80" width="1040" height="470" rx="20" fill="white" fill-opacity="0.95"/>
  
  <!-- ロゴエリア（存在する場合） -->
  {{#if logoUrl}}
  <circle cx="200" cy="200" r="60" fill="{{accentColor}}" fill-opacity="0.1"/>
  <!-- ロゴ画像はここに挿入 -->
  {{/if}}
  
  <!-- 企業名 -->
  <text x="{{#if logoUrl}}320{{else}}120{{/if}}" y="220" 
        font-family="'Hiragino Sans', 'Noto Sans JP', sans-serif" 
        font-size="48" 
        font-weight="bold" 
        fill="{{textColor}}">{{companyName}}</text>
  
  <!-- 説明文 -->
  {{#if description}}
  <text x="{{#if logoUrl}}320{{else}}120{{/if}}" y="280" 
        font-family="'Hiragino Sans', 'Noto Sans JP', sans-serif" 
        font-size="24" 
        fill="{{textColor}}" 
        fill-opacity="0.8">{{description}}</text>
  {{/if}}
  
  <!-- LuxuCare ブランディング -->
  <text x="120" y="500" 
        font-family="'Hiragino Sans', 'Noto Sans JP', sans-serif" 
        font-size="18" 
        fill="{{textColor}}" 
        fill-opacity="0.6">Powered by LuxuCare</text>
  
  <!-- アクセントライン -->
  <rect x="120" y="520" width="100" height="4" fill="{{accentColor}}"/>
</svg>
`;

function generateSVG(options: OGPGenerationOptions): string {
  const {
    companyName,
    description = '',
    logoUrl,
    backgroundColor = '#1a365d',
    textColor = '#2d3748',
    accentColor = '#3182ce'
  } = options;

  let svg = OGP_TEMPLATE;
  
  // テンプレート変数の置換
  svg = svg.replace(/\{\{backgroundColor\}\}/g, backgroundColor);
  svg = svg.replace(/\{\{textColor\}\}/g, textColor);
  svg = svg.replace(/\{\{accentColor\}\}/g, accentColor);
  svg = svg.replace(/\{\{companyName\}\}/g, escapeXml(companyName));
  
  if (description) {
    svg = svg.replace(/\{\{#if description\}\}/g, '');
    svg = svg.replace(/\{\{\/if\}\}/g, '');
    svg = svg.replace(/\{\{description\}\}/g, escapeXml(truncateText(description, 80)));
  } else {
    // description関連の部分を削除
    svg = svg.replace(/\{\{#if description\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  }
  
  if (logoUrl) {
    svg = svg.replace(/\{\{#if logoUrl\}\}/g, '');
    svg = svg.replace(/\{\{\/if\}\}/g, '');
    svg = svg.replace(/\{\{else\}\}/g, '<!-- else -->');
  } else {
    // logoUrl関連の部分を削除し、elseブロックを有効化
    svg = svg.replace(/\{\{#if logoUrl\}\}[\s\S]*?\{\{else\}\}/g, '');
    svg = svg.replace(/\{\{\/if\}\}/g, '');
  }

  return svg;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

async function generateOGPImage(options: OGPGenerationOptions): Promise<Buffer> {
  const svg = generateSVG(options);
  
  return await sharp(Buffer.from(svg))
    .png({ quality: 90 })
    .toBuffer();
}

export async function POST(request: NextRequest) {
  try {
    const supabaseBrowser = supabaseServer();
    
    // ユーザー認証確認
    const { data: { user }, error: authError } = await supabaseBrowser.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      companyName,
      description,
      logoUrl,
      backgroundColor,
      textColor,
      accentColor
    } = body;

    if (!companyName) {
      return NextResponse.json(
        { error: '企業名は必須です' },
        { status: 400 }
      );
    }

    const options: OGPGenerationOptions = {
      companyName,
      description,
      logoUrl,
      backgroundColor,
      textColor,
      accentColor
    };

    // OGP画像生成
    const ogpImageBuffer = await generateOGPImage(options);
    
    // Base64エンコード
    const base64Image = ogpImageBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    // メタデータ生成
    const metadata = {
      'og:title': companyName,
      'og:description': description || `${companyName}の企業情報`,
      'og:image': dataUrl, // 実際の実装では適切なURL
      'og:image:width': OGP_WIDTH.toString(),
      'og:image:height': OGP_HEIGHT.toString(),
      'og:type': 'website',
      'twitter:card': 'summary_large_image',
      'twitter:title': companyName,
      'twitter:description': description || `${companyName}の企業情報`,
      'twitter:image': dataUrl // 実際の実装では適切なURL
    };

    return NextResponse.json({
      success: true,
      image: {
        dataUrl,
        width: OGP_WIDTH,
        height: OGP_HEIGHT,
        size: ogpImageBuffer.length
      },
      metadata,
      message: 'OGP画像とメタデータを生成しました'
    });

  } catch (error) {
    console.error('OGP generation error:', error);
    return NextResponse.json(
      { error: 'OGP生成に失敗しました' },
      { status: 500 }
    );
  }
}