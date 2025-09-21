import { Metadata } from 'next';
import { Locale } from '@/i18n';

interface LocalizedMetadata {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  twitterTitle: string;
  twitterDescription: string;
}

const metadataByLocale: Record<Locale, LocalizedMetadata> = {
  ja: {
    title: 'LuxuCare - AI企業ディレクトリ',
    description: 'LuxuCareは企業情報を効率的に管理・公開できるAI企業ディレクトリプラットフォームです。企業の魅力を最大限に伝える自動化ツールを提供します。',
    keywords: 'AI企業ディレクトリ, 企業情報管理, ビジネスディレクトリ, 企業検索, LuxuCare',
    ogTitle: 'LuxuCare - AI企業ディレクトリ',
    ogDescription: 'LuxuCareは企業情報を効率的に管理・公開できるAI企業ディレクトリプラットフォームです。',
    twitterTitle: 'LuxuCare - AI企業ディレクトリ',
    twitterDescription: 'LuxuCareは企業情報を効率的に管理・公開できるAI企業ディレクトリプラットフォームです。',
  },
  en: {
    title: 'LuxuCare - AI Enterprise Directory',
    description: 'LuxuCare is an AI-powered enterprise directory platform that efficiently manages and publishes company information. We provide automation tools to showcase your company\'s appeal.',
    keywords: 'AI enterprise directory, company information management, business directory, company search, LuxuCare',
    ogTitle: 'LuxuCare - AI Enterprise Directory',
    ogDescription: 'LuxuCare is an AI-powered enterprise directory platform that efficiently manages and publishes company information.',
    twitterTitle: 'LuxuCare - AI Enterprise Directory',
    twitterDescription: 'LuxuCare is an AI-powered enterprise directory platform that efficiently manages and publishes company information.',
  },
  zh: {
    title: 'LuxuCare - AI企业目录',
    description: 'LuxuCare是一个AI驱动的企业目录平台，高效管理和发布企业信息。我们提供自动化工具来展示您企业的魅力。',
    keywords: 'AI企业目录, 企业信息管理, 商业目录, 企业搜索, LuxuCare',
    ogTitle: 'LuxuCare - AI企业目录',
    ogDescription: 'LuxuCare是一个AI驱动的企业目录平台，高效管理和发布企业信息。',
    twitterTitle: 'LuxuCare - AI企业目录',
    twitterDescription: 'LuxuCare是一个AI驱动的企业目录平台，高效管理和发布企业信息。',
  },
  ko: {
    title: 'LuxuCare - AI 기업 디렉토리',
    description: 'LuxuCare는 기업 정보를 효율적으로 관리하고 게시할 수 있는 AI 기업 디렉토리 플랫폼입니다. 기업의 매력을 최대한 전달하는 자동화 도구를 제공합니다.',
    keywords: 'AI 기업 디렉토리, 기업 정보 관리, 비즈니스 디렉토리, 기업 검색, LuxuCare',
    ogTitle: 'LuxuCare - AI 기업 디렉토리',
    ogDescription: 'LuxuCare는 기업 정보를 효율적으로 관리하고 게시할 수 있는 AI 기업 디렉토리 플랫폼입니다.',
    twitterTitle: 'LuxuCare - AI 기업 디렉토리',
    twitterDescription: 'LuxuCare는 기업 정보를 효율적으로 관리하고 게시할 수 있는 AI 기업 디렉토리 플랫폼입니다.',
  },
  es: {
    title: 'LuxuCare - Directorio Empresarial AI',
    description: 'LuxuCare es una plataforma de directorio empresarial impulsada por IA que gestiona y publica información empresarial de manera eficiente. Proporcionamos herramientas de automatización para mostrar el atractivo de su empresa.',
    keywords: 'directorio empresarial AI, gestión de información empresarial, directorio de negocios, búsqueda de empresas, LuxuCare',
    ogTitle: 'LuxuCare - Directorio Empresarial AI',
    ogDescription: 'LuxuCare es una plataforma de directorio empresarial impulsada por IA que gestiona y publica información empresarial de manera eficiente.',
    twitterTitle: 'LuxuCare - Directorio Empresarial AI',
    twitterDescription: 'LuxuCare es una plataforma de directorio empresarial impulsada por IA que gestiona y publica información empresarial de manera eficiente.',
  },
  fr: {
    title: 'LuxuCare - Répertoire d\'Entreprises IA',
    description: 'LuxuCare est une plateforme de répertoire d\'entreprises alimentée par l\'IA qui gère et publie efficacement les informations d\'entreprise. Nous fournissons des outils d\'automatisation pour présenter l\'attrait de votre entreprise.',
    keywords: 'répertoire d\'entreprises IA, gestion des informations d\'entreprise, répertoire d\'affaires, recherche d\'entreprises, LuxuCare',
    ogTitle: 'LuxuCare - Répertoire d\'Entreprises IA',
    ogDescription: 'LuxuCare est une plateforme de répertoire d\'entreprises alimentée par l\'IA qui gère et publie efficacement les informations d\'entreprise.',
    twitterTitle: 'LuxuCare - Répertoire d\'Entreprises IA',
    twitterDescription: 'LuxuCare est une plateforme de répertoire d\'entreprises alimentée par l\'IA qui gère et publie efficacement les informations d\'entreprise.',
  },
  de: {
    title: 'LuxuCare - KI-Unternehmensverzeichnis',
    description: 'LuxuCare ist eine KI-gestützte Unternehmensverzeichnis-Plattform, die Unternehmensinformationen effizient verwaltet und veröffentlicht. Wir bieten Automatisierungstools, um die Attraktivität Ihres Unternehmens zu präsentieren.',
    keywords: 'KI-Unternehmensverzeichnis, Unternehmensinformationsverwaltung, Geschäftsverzeichnis, Unternehmenssuche, LuxuCare',
    ogTitle: 'LuxuCare - KI-Unternehmensverzeichnis',
    ogDescription: 'LuxuCare ist eine KI-gestützte Unternehmensverzeichnis-Plattform, die Unternehmensinformationen effizient verwaltet und veröffentlicht.',
    twitterTitle: 'LuxuCare - KI-Unternehmensverzeichnis',
    twitterDescription: 'LuxuCare ist eine KI-gestützte Unternehmensverzeichnis-Plattform, die Unternehmensinformationen effizient verwaltet und veröffentlicht.',
  },
};

export function generateMetadata(locale: Locale, customTitle?: string, customDescription?: string): Metadata {
  const localizedData = metadataByLocale[locale];
  
  return {
    title: customTitle || localizedData.title,
    description: customDescription || localizedData.description,
    keywords: localizedData.keywords,
    openGraph: {
      title: customTitle || localizedData.ogTitle,
      description: customDescription || localizedData.ogDescription,
      type: 'website',
      locale: locale === 'zh' ? 'zh_CN' : locale === 'ja' ? 'ja_JP' : locale === 'ko' ? 'ko_KR' : `${locale}_${locale.toUpperCase()}`,
      siteName: 'LuxuCare',
    },
    twitter: {
      card: 'summary_large_image',
      title: customTitle || localizedData.twitterTitle,
      description: customDescription || localizedData.twitterDescription,
    },
    alternates: {
      languages: {
        'ja': '/ja',
        'en': '/en',
        'zh': '/zh',
        'ko': '/ko',
        'es': '/es',
        'fr': '/fr',
        'de': '/de',
      },
      canonical: `/${locale}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export function generateStructuredData(locale: Locale, pageType: 'website' | 'organization' | 'article' = 'website') {
  const localizedData = metadataByLocale[locale];
  
  const baseStructuredData = {
    '@context': 'https://schema.org',
    '@type': pageType === 'website' ? 'WebSite' : pageType === 'organization' ? 'Organization' : 'Article',
    name: 'LuxuCare',
    url: `https://luxucare.com/${locale}`,
    description: localizedData.description,
    inLanguage: locale,
  };

  if (pageType === 'website') {
    return {
      ...baseStructuredData,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `https://luxucare.com/${locale}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };
  }

  if (pageType === 'organization') {
    return {
      ...baseStructuredData,
      '@type': 'Organization',
      logo: 'https://luxucare.com/logo.png',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['Japanese', 'English', 'Chinese', 'Korean', 'Spanish', 'French', 'German'],
      },
      sameAs: [
        'https://twitter.com/luxucare',
        'https://linkedin.com/company/luxucare',
      ],
    };
  }

  return baseStructuredData;
}