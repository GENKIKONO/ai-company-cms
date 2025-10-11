'use client';

/**
 * Widget プレビューコンポーネント
 * 管理画面でのWidget表示確認用
 */

import React from 'react';
import type { Organization } from '@/types/database';
import { generateWidgetPreview } from '@/lib/embed/generator';

interface WidgetPreviewProps {
  organization: Organization;
  services?: any[];
  options: {
    theme?: 'light' | 'dark' | 'auto';
    size?: 'small' | 'medium' | 'large';
    showLogo?: boolean;
    showDescription?: boolean;
    showServices?: boolean;
    customCSS?: string;
  };
  baseUrl: string;
}

export function WidgetPreview({ organization, services = [], options, baseUrl }: WidgetPreviewProps) {
  // プレビュー用の仮JSON-LD（実際のAPIでは動的生成）
  const mockJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: organization.name,
    url: organization.url,
    logo: organization.logo_url,
    description: organization.description
  };

  try {
    const previewHtml = generateWidgetPreview({
      organization,
      services: options.showServices ? services : [],
      jsonLd: mockJsonLd,
      options,
      baseUrl
    });

    return (
      <div className="widget-preview-container">
        <div
          className="widget-preview-content"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
        
        {/* プレビュー注記 */}
        <div className="mt-2 text-xs text-gray-500 text-center">
          プレビュー表示（実際の埋め込み時と若干異なる場合があります）
        </div>
        
        <style jsx>{`
          .widget-preview-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            padding: 20px;
            background: ${options.theme === 'dark' ? '#f0f0f0' : '#ffffff'};
          }
          
          .widget-preview-content {
            transform-origin: center;
            box-shadow: none;
          }
          
          /* レスポンシブ対応 */
          @media (max-width: 640px) {
            .widget-preview-container {
              padding: 10px;
            }
            
            .widget-preview-content {
              transform: scale(0.9);
            }
          }
        `}</style>
      </div>
    );
  } catch (error) {
    console.error('Widget preview generation failed:', error);
    
    return (
      <div className="widget-preview-error">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <div className="error-message">
            プレビューの生成に失敗しました
          </div>
          <div className="error-detail">
            {error instanceof Error ? error.message : '不明なエラー'}
          </div>
        </div>
        
        <style jsx>{`
          .widget-preview-error {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 200px;
            padding: 20px;
            background: #fff5f5;
            border: 1px solid #fed7d7;
            border-radius: 8px;
          }
          
          .error-content {
            text-align: center;
            color: #c53030;
          }
          
          .error-icon {
            font-size: 24px;
            margin-bottom: 8px;
          }
          
          .error-message {
            font-weight: 600;
            margin-bottom: 4px;
          }
          
          .error-detail {
            font-size: 12px;
            color: #e53e3e;
            font-family: monospace;
          }
        `}</style>
      </div>
    );
  }
}

/**
 * 軽量版プレビュー（リスト表示用）
 */
export function WidgetPreviewThumbnail({ 
  organization, 
  size = 'small' 
}: { 
  organization: Organization;
  size?: 'small' | 'medium' | 'large';
}) {
  const sizeConfig = {
    small: { width: '200px', height: '120px', fontSize: '11px' },
    medium: { width: '280px', height: '160px', fontSize: '12px' },
    large: { width: '360px', height: '200px', fontSize: '14px' }
  };

  const config = sizeConfig[size];

  return (
    <div className="widget-thumbnail">
      <div className="thumbnail-header">
        {organization.logo_url && (
          <img 
            src={organization.logo_url} 
            alt={`${organization.name}ロゴ`}
            className="thumbnail-logo"
          />
        )}
        <div className="thumbnail-info">
          <h4 className="thumbnail-title">{organization.name}</h4>
          {organization.address_region && (
            <div className="thumbnail-location">
              📍 {organization.address_region}
            </div>
          )}
        </div>
      </div>
      
      {organization.description && (
        <p className="thumbnail-description">
          {organization.description.substring(0, 60)}
          {organization.description.length > 60 ? '...' : ''}
        </p>
      )}
      
      <div className="thumbnail-footer">
        <span>Powered by LuxuCare</span>
      </div>
      
      <style jsx>{`
        .widget-thumbnail {
          width: ${config.width};
          height: ${config.height};
          padding: 12px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          box-shadow: none;
          font-size: ${config.fontSize};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .thumbnail-header {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .thumbnail-logo {
          width: 24px;
          height: 24px;
          object-fit: contain;
          border-radius: 3px;
          margin-right: 8px;
        }
        
        .thumbnail-info {
          flex: 1;
          min-width: 0;
        }
        
        .thumbnail-title {
          font-weight: 600;
          margin: 0;
          font-size: 1.1em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #1a202c;
        }
        
        .thumbnail-location {
          font-size: 0.9em;
          color: #718096;
          margin-top: 2px;
        }
        
        .thumbnail-description {
          flex: 1;
          margin: 0;
          color: #4a5568;
          line-height: 1.3;
          font-size: 0.95em;
        }
        
        .thumbnail-footer {
          margin-top: auto;
          padding-top: 6px;
          border-top: 1px solid #f7fafc;
          text-align: center;
          color: #a0aec0;
          font-size: 0.8em;
        }
      `}</style>
    </div>
  );
}