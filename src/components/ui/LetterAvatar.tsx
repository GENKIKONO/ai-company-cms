/**
 * LetterAvatar - 企業ロゴ未設定や読み込み失敗時のフォールバック
 */

import { cn } from '@/lib/utils';

interface LetterAvatarProps {
  name: string;
  size?: number;
  className?: string;
  rounded?: 'full' | 'lg' | 'md' | 'sm';
}

export const LetterAvatar: React.FC<LetterAvatarProps> = ({
  name,
  size = 48,
  className,
  rounded = 'lg',
}) => {
  // 先頭1-2文字を取得（日本語・英語対応）
  const getInitials = (text: string): string => {
    if (!text) return '?';
    
    // 英語の場合: 単語の先頭文字を最大2文字
    if (/^[a-zA-Z\s]+$/.test(text)) {
      return text
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
    }
    
    // 日本語の場合: 先頭1-2文字
    const cleanText = text.replace(/[（）\(\)株式会社有限会社]/g, '').trim();
    return cleanText.slice(0, 2);
  };

  const initials = getInitials(name);
  
  const roundedClasses = {
    full: 'rounded-full',
    lg: 'rounded-lg',
    md: 'rounded-md',
    sm: 'rounded-sm',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold shadow-sm',
        roundedClasses[rounded],
        className
      )}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${Math.max(12, size * 0.4)}px`,
      }}
      title={name}
    >
      {initials}
    </div>
  );
};

export default LetterAvatar;