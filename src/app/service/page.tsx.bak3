import { Metadata } from 'next';
import Stage from './sections/Stage';
import Characters from './sections/Characters';
import Conflict from './sections/Conflict';
import BigIdea from './sections/BigIdea';
import Solution from './sections/Solution';
import Recap from './sections/Recap';
import ClosingCTA from './sections/ClosingCTA';
import { serviceCopy } from './copy';

export const metadata: Metadata = {
  title: serviceCopy.metadata.title,
  description: serviceCopy.metadata.description,
  openGraph: {
    title: serviceCopy.metadata.title,
    description: serviceCopy.metadata.description,
    url: '/service',
    siteName: 'AIO Hub',
    type: 'website',
    images: [
      {
        url: '/service/og.png',
        width: 1200,
        height: 630,
        alt: serviceCopy.metadata.title,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: serviceCopy.metadata.title,
    description: serviceCopy.metadata.description,
    images: ['/service/og.png'],
  },
};

export default function ServicePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: serviceCopy.metadata.title,
    description: serviceCopy.metadata.description,
    url: 'https://aiohub.jp/service',
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'ホーム',
          item: 'https://aiohub.jp',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'サービス概要',
          item: 'https://aiohub.jp/service',
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <main>
        <Stage />
        <Characters />
        <Conflict />
        <BigIdea />
        <Solution />
        <Recap />
        <ClosingCTA />
      </main>
    </>
  );
}