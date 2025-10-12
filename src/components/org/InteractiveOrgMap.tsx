'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

interface InteractiveOrgMapProps {
  initialLat?: number;
  initialLng?: number;
  address?: string;
  organizationName?: string;
  onLocationChange?: (lat: number, lng: number) => void;
  className?: string;
}

export default function InteractiveOrgMap({ 
  initialLat = 35.6762, 
  initialLng = 139.6503, 
  address = '',
  organizationName = '',
  onLocationChange,
  className = '' 
}: InteractiveOrgMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState({ lat: initialLat, lng: initialLng });

  useEffect(() => {
    if (!mapRef.current) return;

    let isMounted = true;

    const loadMap = async () => {
      try {
        if (typeof window === 'undefined') return;
        
        // Load Leaflet with CDN CSS
        const L = await import('leaflet');
        
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
          cssLink.crossOrigin = 'anonymous';
          document.head.appendChild(cssLink);
          
          await new Promise(resolve => {
            cssLink.onload = resolve;
            cssLink.onerror = resolve;
          });
        }

        if (!isMounted) return;

        // Remove existing map
        if (mapInstance.current) {
          mapInstance.current.remove();
        }

        // Create map
        const map = L.default.map(mapRef.current!).setView([currentLocation.lat, currentLocation.lng], 16);
        mapInstance.current = map;

        // Add tile layer
        L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Create draggable marker
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
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
              cursor: grab;
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
          className: 'interactive-marker',
          iconSize: [30, 30],
          iconAnchor: [15, 30],
          popupAnchor: [0, -30]
        });

        const marker = L.default.marker([currentLocation.lat, currentLocation.lng], { 
          icon: customIcon,
          draggable: true
        }).addTo(map);

        markerRef.current = marker;

        // Marker drag event
        marker.on('dragend', function(e: any) {
          const position = e.target.getLatLng();
          const newLat = position.lat;
          const newLng = position.lng;
          
          setCurrentLocation({ lat: newLat, lng: newLng });
          
          if (onLocationChange) {
            onLocationChange(newLat, newLng);
          }
        });

        // Map click event to move marker
        map.on('click', function(e: any) {
          const newLat = e.latlng.lat;
          const newLng = e.latlng.lng;
          
          marker.setLatLng([newLat, newLng]);
          setCurrentLocation({ lat: newLat, lng: newLng });
          
          if (onLocationChange) {
            onLocationChange(newLat, newLng);
          }
        });

        // Add popup to marker
        const popupContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
              ${organizationName || '位置を調整'}
            </h3>
            ${address ? `
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
                ${address}
              </p>
            ` : ''}
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af;">
              緯度: ${currentLocation.lat.toFixed(6)}<br>
              経度: ${currentLocation.lng.toFixed(6)}
            </p>
            <p style="margin: 0; font-size: 12px; color: #3b82f6; font-weight: 500;">
              ピンをドラッグまたは地図をクリックして位置を調整
            </p>
          </div>
        `;

        marker.bindPopup(popupContent).openPopup();

        if (isMounted) {
          setIsLoaded(true);
        }

      } catch (error) {
        console.error('Interactive map loading error:', error);
        if (isMounted) {
          setLoadError('インタラクティブ地図の読み込みに失敗しました');
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
  }, [initialLat, initialLng, organizationName, address]);

  // Update marker position when external coordinates change
  useEffect(() => {
    if (markerRef.current && (initialLat !== currentLocation.lat || initialLng !== currentLocation.lng)) {
      setCurrentLocation({ lat: initialLat, lng: initialLng });
      markerRef.current.setLatLng([initialLat, initialLng]);
      
      if (mapInstance.current) {
        mapInstance.current.setView([initialLat, initialLng], 16);
        
        // Update popup content
        const popupContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
              ${organizationName || '位置を調整'}
            </h3>
            ${address ? `
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
                ${address}
              </p>
            ` : ''}
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af;">
              緯度: ${initialLat.toFixed(6)}<br>
              経度: ${initialLng.toFixed(6)}
            </p>
            <p style="margin: 0; font-size: 12px; color: #3b82f6; font-weight: 500;">
              ピンをドラッグまたは地図をクリックして位置を調整
            </p>
          </div>
        `;
        
        markerRef.current.bindPopup(popupContent);
      }
    }
  }, [initialLat, initialLng, organizationName, address]);

  if (loadError) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="h-6 w-6 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">位置調整</h3>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-700">{loadError}</p>
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
          <h3 className="text-lg font-semibold text-gray-900">位置調整</h3>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            地図上でピンをドラッグするか、クリックして正確な位置を設定してください
          </p>
          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border">
            現在の位置: 緯度 {currentLocation.lat.toFixed(6)}, 経度 {currentLocation.lng.toFixed(6)}
          </div>
        </div>
        
        {/* Map display area */}
        <div className="relative">
          {!isLoaded && (
            <div className="absolute inset-0 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">インタラクティブ地図を読み込み中...</p>
              </div>
            </div>
          )}
          
          <div 
            ref={mapRef} 
            className="h-80 w-full rounded-lg border border-gray-200"
            style={{ minHeight: '320px' }}
          />
        </div>
      </div>
    </div>
  );
}