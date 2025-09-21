'use client';

import { useState, useEffect } from 'react';
import { useFavorites } from '@/hooks/useFavorites';
import { trackEvent } from '@/lib/analytics';

interface Props {
  organization: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    industries?: string[];
    address_region?: string;
  };
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function FavoriteButton({ 
  organization, 
  variant = 'icon', 
  size = 'md',
  className = '' 
}: Props) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isClient, setIsClient] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const wasFavorite = isFavorite(organization.id);
    toggleFavorite(organization);
    
    // アニメーション
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    
    // Analytics追跡
    trackEvent({
      name: wasFavorite ? 'Remove from Favorites' : 'Add to Favorites',
      properties: {
        organization_id: organization.id,
        organization_name: organization.name,
        action: wasFavorite ? 'remove' : 'add',
      },
    });
  };

  if (!isClient) {
    // SSRでは何も表示しない（hydration mismatch回避）
    return null;
  }

  const isFav = isFavorite(organization.id);

  // サイズ設定
  const sizeClasses = {
    sm: variant === 'icon' ? 'w-6 h-6' : 'px-2 py-1 text-sm',
    md: variant === 'icon' ? 'w-8 h-8' : 'px-3 py-2 text-sm',
    lg: variant === 'icon' ? 'w-10 h-10' : 'px-4 py-2 text-base',
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        className={`
          ${sizeClasses[size]} 
          flex items-center justify-center
          rounded-full
          transition-all duration-200
          ${isFav 
            ? 'text-red-500 hover:text-red-600' 
            : 'text-gray-400 hover:text-red-500'
          }
          ${isAnimating ? 'scale-125' : 'scale-100'}
          ${className}
        `}
        title={isFav ? 'お気に入りから削除' : 'お気に入りに追加'}
        aria-label={isFav ? 'お気に入りから削除' : 'お気に入りに追加'}
      >
        <svg
          fill={isFav ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
          className="w-full h-full"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={isFav ? 0 : 2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`
        ${sizeClasses[size]}
        flex items-center space-x-2
        border rounded-md
        transition-all duration-200
        ${isFav 
          ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' 
          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }
        ${isAnimating ? 'scale-105' : 'scale-100'}
        ${className}
      `}
    >
      <svg
        fill={isFav ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
        className="w-4 h-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={isFav ? 0 : 2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span>
        {isFav ? 'お気に入り済み' : 'お気に入り'}
      </span>
    </button>
  );
}