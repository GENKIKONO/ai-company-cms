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
            bg-gray-100 border-2 border-dashed border-gray-300 
            rounded-xl flex flex-col items-center justify-center
            text-gray-400 transition-colors hover:bg-gray-50
          `}
        >
          {/* 画像アイコン */}
          <svg 
            className="w-16 h-16 mb-4" 
            fill="currentColor" 
            viewBox="0 0 24 24"
            role="img"
            aria-label="画像プレースホルダ"
          >
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
          
          {/* プレースホルダテキスト */}
          <div className="text-center px-4">
            <p className="text-lg font-medium mb-1">画像差し替えスロット</p>
            <p className="text-sm">
              CMS接続後に動的画像が表示されます
            </p>
            <p className="text-xs mt-2 text-gray-500">
              アスペクト比: {aspect} | サイズ: {size}
            </p>
          </div>
        </div>
        
        {/* キャプション（プレースホルダ）*/}
        {caption && (
          <p className="mt-3 text-sm text-gray-600 text-center italic">
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