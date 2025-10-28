'use client';

interface SectionMediaProps {
  image?: string;
  alt?: string;
  caption?: string;
  aspect?: '16/9' | '4/3' | '1/1';
  align?: 'left' | 'right' | 'center';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * セクション用画像スロット（差し替え前提）
 * 画像未指定時はプレースホルダ表示
 */
export default function SectionMedia({
  image,
  alt = 'セクション画像',
  caption,
  aspect = '16/9',
  align = 'center',
  size = 'medium',
  className = ''
}: SectionMediaProps) {
  
  // アスペクト比の計算
  const aspectRatios = {
    '16/9': 'aspect-[16/9]',
    '4/3': 'aspect-[4/3]',
    '1/1': 'aspect-square'
  };

  // サイズ設定
  const sizes = {
    small: 'max-w-md',
    medium: 'max-w-2xl', 
    large: 'max-w-4xl'
  };

  // アライメント設定
  const alignments = {
    left: 'mx-0',
    center: 'mx-auto',
    right: 'mx-0 ml-auto'
  };

  const containerClasses = `
    ${sizes[size]} 
    ${alignments[align]} 
    ${className}
  `.trim();

  // プレースホルダ表示（画像未設定時）
  if (!image) {
    return (
      <div className={containerClasses}>
        <div 
          className={`
            ${aspectRatios[aspect]} 
            bg-gray-100
            border border-gray-200
            rounded-xl flex flex-col items-center justify-center
            text-gray-500 transition-all duration-300 hover:bg-gray-200
            shadow-sm
          `}
        >
          {/* 改良された画像アイコン */}
          <div className="relative">
            <svg 
              className="w-12 h-12 mb-3 text-gray-400" 
              fill="none"
              stroke="currentColor" 
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              role="img"
              aria-label="画像プレースホルダ"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          </div>
          
          {/* プレースホルダテキスト */}
          <div className="text-center px-6">
            <p className="text-sm font-medium text-gray-600 mb-1">コンテンツ表示エリア</p>
            <p className="text-xs text-gray-500">
              動的コンテンツがここに表示されます
            </p>
          </div>
        </div>
        
        {/* キャプション（プレースホルダ）*/}
        {caption && (
          <p className="mt-3 text-sm text-gray-600 text-center font-medium">
            {caption}
          </p>
        )}
      </div>
    );
  }

  // 実際の画像表示
  return (
    <div className={containerClasses}>
      <div className={`${aspectRatios[aspect]} overflow-hidden rounded-xl`}>
        <img
          src={image}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      
      {/* キャプション */}
      {caption && (
        <p className="mt-3 text-sm text-gray-600 text-center">
          {caption}
        </p>
      )}
    </div>
  );
}

// 便利なバリエーション
export function HeroMedia(props: Omit<SectionMediaProps, 'size' | 'aspect'>) {
  return <SectionMedia {...props} size="large" aspect="16/9" />;
}

export function FeatureMedia(props: Omit<SectionMediaProps, 'size' | 'aspect'>) {
  return <SectionMedia {...props} size="medium" aspect="4/3" />;
}

export function IconMedia(props: Omit<SectionMediaProps, 'size' | 'aspect'>) {
  return <SectionMedia {...props} size="small" aspect="1/1" />;
}