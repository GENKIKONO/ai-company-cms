'use client';

import { ExternalLink, Navigation } from 'lucide-react';

interface AddressDisplayProps {
  postalCode?: string;
  fullAddress: string;
  organizationName?: string;
  showGoogleMapsLink?: boolean;
  showDirectionsLink?: boolean;
  compact?: boolean;
  className?: string;
}

export default function AddressDisplay({
  postalCode,
  fullAddress,
  organizationName = '',
  showGoogleMapsLink = true,
  showDirectionsLink = true,
  compact = false,
  className = ''
}: AddressDisplayProps) {
  // Don't render if no address provided
  if (!fullAddress || fullAddress.trim() === '') {
    return null;
  }

  // Create Google Maps URLs
  const searchQuery = encodeURIComponent(`${organizationName} ${fullAddress}`.trim());
  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${searchQuery}`;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 text-red-500">
            <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">所在地</h3>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          {/* Postal Code */}
          {postalCode && (
            <div className="text-sm text-gray-600 mb-2 font-mono">
              〒{postalCode}
            </div>
          )}
          
          {/* Full Address */}
          <div className="text-base text-gray-900 mb-4 leading-relaxed whitespace-pre-line">
            {fullAddress}
          </div>
          
          {/* Action Buttons */}
          {(showGoogleMapsLink || showDirectionsLink) && (
            <div className={`flex ${compact ? 'flex-col gap-2' : 'flex-row gap-3'} ${compact ? 'items-stretch' : 'items-center'}`}>
              {showGoogleMapsLink && (
                <a
                  href={googleMapsSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  aria-label={`${organizationName || '所在地'}をGoogleマップで表示`}
                >
                  <ExternalLink className="w-4 h-4" />
                  Googleマップで開く
                </a>
              )}
              
              {showDirectionsLink && (
                <a
                  href={googleMapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-green-600 bg-white border border-green-300 rounded-md hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                  aria-label={`${organizationName || '所在地'}へのルートを検索`}
                >
                  <Navigation className="w-4 h-4" />
                  ルート検索
                </a>
              )}
            </div>
          )}
        </div>
        
        {/* Fallback message if no address */}
        {!fullAddress && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
            <p className="text-gray-500 text-sm">住所情報が登録されていません</p>
          </div>
        )}
      </div>
    </div>
  );
}