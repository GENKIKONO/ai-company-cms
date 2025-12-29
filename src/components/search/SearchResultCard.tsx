'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/components/layout/I18nProvider';
import { LogoImage } from '@/components/ui/optimized-image';
import { 
  Building2, 
  MapPin, 
  Calendar,
  Star,
  Users,
  Phone,
  Globe,
  Award,
  CheckCircle,
  ExternalLink,
  Heart,
  Share2
} from 'lucide-react';
import type { Organization, Service, CaseStudy } from '@/types/legacy/database';
import { logger } from '@/lib/utils/logger';

// Claude改善: 柔軟性を保った型定義
interface SearchResultCardProps {
  type: 'organization' | 'service' | 'case_study';
  data: Organization | (Service & { organization: Organization }) | (CaseStudy & { organization: Organization });
  onFavorite?: (id: string) => void;
  onShare?: (item: any) => void;
  isFavorited?: boolean;
}

export default function SearchResultCard(props: SearchResultCardProps) {
  const { type, data, onFavorite, onShare, isFavorited = false } = props;
  const { t, formatDate } = useI18n();
  const [imageError, setImageError] = useState(false);

  // Claude改善: エラーハンドリングとアクセシビリティ向上
  const handleFavoriteClick = (id: string) => {
    try {
      onFavorite?.(id);
    } catch (error) {
      logger.error('Failed to toggle favorite', { data: error instanceof Error ? error : new Error(String(error)) });
    }
  };

  const handleShareClick = (item: any) => {
    try {
      onShare?.(item);
    } catch (error) {
      logger.error('Failed to share item', { data: error instanceof Error ? error : new Error(String(error)) });
    }
  };

  const renderOrganizationCard = (org: Organization) => {
    const location = [org.address_locality, org.address_region].filter(Boolean).join('、');
    const foundedYear = org.established_at ? new Date(org.established_at).getFullYear() : null;

    return (
      <div className="bg-white  border border-slate-200  rounded-lg p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start gap-4">
          {/* ロゴ */}
          <div className="flex-shrink-0">
            {org.logo_url && !imageError ? (
              <LogoImage
                src={org.logo_url}
                alt={`${org.name} logo`}
                size="lg"
                organizationName={org.name}
                className="w-20 h-20 object-contain bg-slate-50  rounded-lg border border-slate-200 "
              />
            ) : (
              <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-8 h-8 text-[var(--aio-primary)] " />
              </div>
            )}
          </div>

          {/* 企業情報 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-900  mb-2">
                  {org.slug && org.slug.trim() !== '' ? (
                    <Link 
                      href={`/o/${org.slug}`}
                      className="hover:text-[var(--aio-primary)]  transition-colors"
                      aria-label={`${org.name}の詳細ページを見る`}
                    >
                      {org.name}
                    </Link>
                  ) : (
                    <span className="text-slate-600">{org.name}</span>
                  )}
                </h3>
                
                {org.description && (
                  <p className="text-slate-600  mb-3 line-clamp-2">
                    {org.description}
                  </p>
                )}

                {/* メタ情報 */}
                <div className="flex flex-wrap gap-4 text-sm text-slate-600  mb-3">
                  {location && (
                    <span className="flex items-center gap-1" title={`所在地: ${location}`}>
                      <MapPin className="w-4 h-4" aria-hidden="true" />
                      {location}
                    </span>
                  )}
                  {foundedYear && (
                    <span className="flex items-center gap-1" title={`設立年: ${foundedYear}年`}>
                      <Calendar className="w-4 h-4" aria-hidden="true" />
                      {foundedYear}年設立
                    </span>
                  )}
                  {org.employees && (
                    <span className="flex items-center gap-1" title={`従業員数: ${org.employees}名`}>
                      <Users className="w-4 h-4" aria-hidden="true" />
                      {org.employees}名
                    </span>
                  )}
                </div>

                {/* 業界・タグ */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {org.industries && org.industries.length > 0 && org.industries.map((industry, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100  text-blue-800  text-sm rounded-full">
                      {industry}
                    </span>
                  ))}
                  {org.awards && org.awards.length > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100  text-yellow-800  text-sm rounded-full">
                      <Award className="w-3 h-3" aria-hidden="true" />
                      受賞歴あり
                    </span>
                  )}
                  {org.certifications && org.certifications.length > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-100  text-green-800  text-sm rounded-full">
                      <CheckCircle className="w-3 h-3" aria-hidden="true" />
                      認証取得
                    </span>
                  )}
                </div>
              </div>

              {/* アクション */}
              <div className="flex items-center gap-2 ml-4">
                {onFavorite && (
                  <button
                    onClick={() => handleFavoriteClick(org.id)}
                    className={`p-2 rounded-full transition-colors ${
                      isFavorited 
                        ? 'text-red-600 bg-red-50 ' 
                        : 'text-slate-600 hover:text-red-600 hover:bg-red-50 '
                    }`}
                    aria-label={isFavorited ? 'お気に入りから削除' : 'お気に入りに追加'}
                  >
                    <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                  </button>
                )}
                {onShare && (
                  <button
                    onClick={() => handleShareClick(org)}
                    className="p-2 text-slate-600 hover:text-[var(--aio-primary)] hover:bg-[var(--aio-info-surface)]  rounded-full transition-colors"
                    aria-label="共有する"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* 連絡先情報 */}
            <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-slate-200 ">
              {org.url && (
                <a 
                  href={org.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-600  hover:text-[var(--aio-primary)]  transition-colors"
                  aria-label={`${org.name}のウェブサイトを開く（新しいタブ）`}
                >
                  <Globe className="w-4 h-4" aria-hidden="true" />
                  ウェブサイト
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderServiceCard = (service: Service & { organization: Organization }) => {
    return (
      <div className="bg-white  border border-slate-200  rounded-lg p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900  mb-1">
              {service.organization.slug && service.organization.slug.trim() !== '' ? (
                <Link 
                  href={`/o/${service.organization.slug}/services/${service.id}`}
                  className="hover:text-[var(--aio-primary)]  transition-colors"
                  aria-label={`サービス「${service.name}」の詳細を見る`}
                >
                  {service.name}
                </Link>
              ) : (
                <span className="text-slate-600">{service.name}</span>
              )}
            </h3>
            <p className="text-sm text-slate-600  mb-2">
              {service.organization.slug && service.organization.slug.trim() !== '' ? (
                <Link 
                  href={`/o/${service.organization.slug}`}
                  className="hover:text-[var(--aio-primary)]  transition-colors"
                  aria-label={`${service.organization.name}の詳細ページを見る`}
                >
                  {service.organization.name}
                </Link>
              ) : (
                <span className="text-slate-600">{service.organization.name}</span>
              )}
            </p>
          </div>

          {/* アクション */}
          <div className="flex items-center gap-2">
            {onFavorite && (
              <button
                onClick={() => handleFavoriteClick(service.id)}
                className={`p-2 rounded-full transition-colors ${
                  isFavorited 
                    ? 'text-red-600 bg-red-50 ' 
                    : 'text-slate-600 hover:text-red-600 hover:bg-red-50 '
                }`}
                aria-label={isFavorited ? 'お気に入りから削除' : 'お気に入りに追加'}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
            )}
            {onShare && (
              <button
                onClick={() => handleShareClick(service)}
                className="p-2 text-slate-600 hover:text-[var(--aio-primary)] hover:bg-[var(--aio-info-surface)]  rounded-full transition-colors"
                aria-label="共有する"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {service.description && (
          <p className="text-slate-600  mb-3 line-clamp-2">
            {service.description}
          </p>
        )}

        {/* サービス詳細 */}
        <div className="flex flex-wrap gap-2 mb-3">
          {service.category && (
            <span className="px-2 py-1 bg-purple-100  text-purple-800  text-sm rounded-full">
              {service.category}
            </span>
          )}
          {service.price && (
            <span className="px-2 py-1 bg-green-100  text-green-800  text-sm rounded-full">
              ¥{service.price.toLocaleString()}
            </span>
          )}
        </div>

        {service.updated_at && (
          <p className="text-xs text-slate-600 ">
            {formatDate(new Date(service.updated_at))}更新
          </p>
        )}
      </div>
    );
  };

  const renderCaseStudyCard = (caseStudy: CaseStudy & { organization: Organization }) => {
    return (
      <div className="bg-white  border border-slate-200  rounded-lg p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900  mb-1">
              {caseStudy.organization.slug && caseStudy.organization.slug.trim() !== '' ? (
                <Link 
                  href={`/o/${caseStudy.organization.slug}/case-studies/${caseStudy.id}`}
                  className="hover:text-[var(--aio-primary)]  transition-colors"
                  aria-label={`事例「${caseStudy.title}」の詳細を見る`}
                >
                  {caseStudy.title}
                </Link>
              ) : (
                <span className="text-slate-600">{caseStudy.title}</span>
              )}
            </h3>
            <p className="text-sm text-slate-600  mb-2">
              {caseStudy.organization.slug && caseStudy.organization.slug.trim() !== '' ? (
                <Link 
                  href={`/o/${caseStudy.organization.slug}`}
                  className="hover:text-[var(--aio-primary)]  transition-colors"
                  aria-label={`${caseStudy.organization.name}の詳細ページを見る`}
                >
                  {caseStudy.organization.name}
                </Link>
              ) : (
                <span className="text-slate-600">{caseStudy.organization.name}</span>
              )}
            </p>
          </div>

          {/* アクション */}
          <div className="flex items-center gap-2">
            {onFavorite && (
              <button
                onClick={() => handleFavoriteClick(caseStudy.id)}
                className={`p-2 rounded-full transition-colors ${
                  isFavorited 
                    ? 'text-red-600 bg-red-50 ' 
                    : 'text-slate-600 hover:text-red-600 hover:bg-red-50 '
                }`}
                aria-label={isFavorited ? 'お気に入りから削除' : 'お気に入りに追加'}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
            )}
            {onShare && (
              <button
                onClick={() => handleShareClick(caseStudy)}
                className="p-2 text-slate-600 hover:text-[var(--aio-primary)] hover:bg-[var(--aio-info-surface)]  rounded-full transition-colors"
                aria-label="共有する"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {caseStudy.problem && (
          <p className="text-slate-600  mb-3 line-clamp-2">
            {caseStudy.problem}
          </p>
        )}

        {/* 事例メタ情報 */}
        <div className="flex flex-wrap gap-2 mb-3">
          {caseStudy.tags && caseStudy.tags.length > 0 && caseStudy.tags.map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-blue-100  text-blue-800  text-sm rounded-full">
              {tag}
            </span>
          ))}
        </div>

        {caseStudy.updated_at && (
          <p className="text-xs text-slate-600 ">
            {formatDate(new Date(caseStudy.updated_at))}更新
          </p>
        )}
      </div>
    );
  };

  // Claude改善: 型安全性向上とエラーハンドリング
  switch (type) {
    case 'organization':
      return renderOrganizationCard(data as Organization);
    case 'service':
      return renderServiceCard(data as Service & { organization: Organization });
    case 'case_study':
      return renderCaseStudyCard(data as CaseStudy & { organization: Organization });
    default:
      logger.error('Unknown card type:', { data: type });
      return null;
  }
}