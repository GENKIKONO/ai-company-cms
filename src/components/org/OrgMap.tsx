'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { Organization } from '@/types/database';

interface OrgMapProps {
  organization: Organization;
  className?: string;
}

export default function OrgMap({ organization, className = '' }: OrgMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 住所が存在するかチェック
  const hasAddress = organization.address_region || organization.address_locality || organization.address_street;
  const fullAddress = [
    organization.address_region,
    organization.address_locality,
    organization.address_street
  ].filter(Boolean).join(' ');

  useEffect(() => {
    if (!hasAddress || !mapRef.current) return;

    let isMounted = true;

    const loadMap = async () => {
      try {
        // ✅ FIXED: Improved build stability with proper dynamic loading
        if (typeof window === 'undefined') return;
        
        // ✅ FIXED: Load Leaflet with CDN CSS (build-stable)
        const L = await import('leaflet');
        
        // Load CSS from CDN with integrity check
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
          cssLink.crossOrigin = 'anonymous';
          document.head.appendChild(cssLink);
          
          // Wait for CSS to load
          await new Promise(resolve => {
            cssLink.onload = resolve;
            cssLink.onerror = resolve; // Continue even if CSS fails
          });
        }

        if (!isMounted) return;

        // 住所をジオコーディング（簡易版 - OpenStreetMap Nominatim API使用）
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress + ', Japan')}&limit=1`;
        
        const geoResponse = await fetch(geocodeUrl);
        const geoData = await geoResponse.json();
        
        if (!isMounted) return;

        let lat = 35.6762; // デフォルト: 東京駅
        let lng = 139.6503;
        
        if (geoData && geoData.length > 0) {
          lat = parseFloat(geoData[0].lat);
          lng = parseFloat(geoData[0].lon);
        }

        // ✅ FIXED: Improved map initialization with proper Leaflet reference
        if (mapInstance.current) {
          mapInstance.current.remove();
        }

        const map = L.default.map(mapRef.current!).setView([lat, lng], 15);
        mapInstance.current = map;

        // OpenStreetMapタイル追加
        L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // ✅ FIXED: Improved marker with proper Leaflet reference and SVG icon
        const customIcon = L.default.divIcon({
          html: `
            <div style="
              background-color: #3b82f6;
              width: 30px;
              height: 30px;
              border-radius: 50% 50% 50% 0;
              border: 3px solid #ffffff;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: none;
            ">
              <div style="
                color: white;
                transform: rotate(45deg);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
            </div>
          `,
          className: 'custom-marker',
          iconSize: [30, 30],
          iconAnchor: [15, 30],
          popupAnchor: [0, -30]
        });

        L.default.marker([lat, lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
                ${organization.name}
              </h3>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
                ${fullAddress}
              </p>
              ${organization.telephone ? `
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; display: flex; align-items: center; gap: 4px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  ${organization.telephone}
                </p>
              ` : ''}
              <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 style="
                   display: inline-flex;
                   align-items: center;
                   gap: 4px;
                   color: #3b82f6;
                   text-decoration: none;
                   font-size: 14px;
                   font-weight: 500;
                 ">
                Google Mapsで開く
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </a>
            </div>
          `);

        if (isMounted) {
          setIsLoaded(true);
        }

      } catch (error) {
        console.error('Map loading error:', error);
        if (isMounted) {
          setLoadError('地図の読み込みに失敗しました');
        }
      }
    };

    loadMap();

    return () => {
      isMounted = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [hasAddress, fullAddress, organization.name, organization.telephone]);

  if (!hasAddress) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 text-center ${className}`}>
        <MapPin className="mx-auto mb-3 h-8 w-8 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">所在地情報</h3>
        <p className="text-gray-500">住所情報が登録されていません</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="h-6 w-6 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">所在地</h3>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-700">{loadError}</p>
          </div>
          
          <div className="mt-4">
            <p className="text-gray-700 mb-3">{fullAddress}</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ExternalLink size={16} />
              Google Mapsで開く
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">所在地</h3>
        </div>
        
        <p className="text-gray-700 mb-4">{fullAddress}</p>
        
        {/* 地図表示エリア */}
        <div className="relative">
          {!isLoaded && (
            <div className="absolute inset-0 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">地図を読み込み中...</p>
              </div>
            </div>
          )}
          
          <div 
            ref={mapRef} 
            className="h-64 w-full rounded-lg border border-gray-200"
            style={{ minHeight: '256px' }}
          />
        </div>
        
        <div className="mt-4 flex justify-end">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ExternalLink size={16} />
            Google Mapsで開く
          </a>
        </div>
      </div>
    </div>
  );
}