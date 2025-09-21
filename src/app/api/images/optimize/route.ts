import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import sharp from 'sharp';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_WIDTH = 1600;
const QUALITY = 80;

interface OptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseServer();
    
    // ユーザー認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const options = formData.get('options') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが指定されていません' },
        { status: 400 }
      );
    }

    // ファイルサイズチェック
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'ファイルサイズが大きすぎます（10MB以下）' },
        { status: 400 }
      );
    }

    // 画像ファイルチェック
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '画像ファイルを指定してください' },
        { status: 400 }
      );
    }

    // オプション解析
    let optimizationOptions: OptimizationOptions = {
      width: MAX_WIDTH,
      quality: QUALITY,
      format: 'webp'
    };

    if (options) {
      try {
        const parsedOptions = JSON.parse(options);
        optimizationOptions = { ...optimizationOptions, ...parsedOptions };
      } catch (error) {
        console.error('Options parsing error:', error);
      }
    }

    // 画像バッファ取得
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Sharp による画像最適化
    let pipeline = sharp(buffer);

    // メタデータ取得
    const metadata = await pipeline.metadata();
    
    // EXIF データ削除
    pipeline = pipeline.rotate(); // 自動回転でEXIF orientation処理

    // サイズ調整
    if (optimizationOptions.width || optimizationOptions.height) {
      pipeline = pipeline.resize({
        width: optimizationOptions.width,
        height: optimizationOptions.height,
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // フォーマット変換と品質設定
    switch (optimizationOptions.format) {
      case 'webp':
        pipeline = pipeline.webp({ 
          quality: optimizationOptions.quality,
          effort: 6 
        });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ 
          quality: optimizationOptions.quality,
          progressive: true 
        });
        break;
      case 'png':
        pipeline = pipeline.png({ 
          compressionLevel: 9,
          progressive: true 
        });
        break;
    }

    const optimizedBuffer = await pipeline.toBuffer();
    const optimizedMetadata = await sharp(optimizedBuffer).metadata();

    // 最適化結果
    const result = {
      originalSize: buffer.length,
      optimizedSize: optimizedBuffer.length,
      compressionRatio: Math.round((1 - optimizedBuffer.length / buffer.length) * 100),
      originalFormat: metadata.format,
      optimizedFormat: optimizationOptions.format,
      originalDimensions: {
        width: metadata.width,
        height: metadata.height
      },
      optimizedDimensions: {
        width: optimizedMetadata.width,
        height: optimizedMetadata.height
      }
    };

    // Base64エンコード（小さい画像の場合）またはURL生成
    let imageData: string;
    if (optimizedBuffer.length < 100 * 1024) { // 100KB未満
      const base64 = optimizedBuffer.toString('base64');
      imageData = `data:image/${optimizationOptions.format};base64,${base64}`;
    } else {
      // 大きい画像の場合は一時的なURLを生成する必要がある
      // 実装では Supabase Storage または外部ストレージを使用
      imageData = 'url_placeholder'; // 実際の実装では適切なURL
    }

    return NextResponse.json({
      success: true,
      result,
      imageData: optimizedBuffer.length < 100 * 1024 ? imageData : undefined,
      message: `画像を最適化しました（${result.compressionRatio}%削減）`
    });

  } catch (error) {
    console.error('Image optimization error:', error);
    return NextResponse.json(
      { error: '画像最適化に失敗しました' },
      { status: 500 }
    );
  }
}