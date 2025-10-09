import { Metadata } from 'next';
import Stage from './sections/Stage';
import Characters from './sections/Characters';
import Conflict from './sections/Conflict';
import BigIdea from './sections/BigIdea';
import Solution from './sections/Solution';
import Recap from './sections/Recap';
import ClosingCTA from './sections/ClosingCTA';
import { aioCopy } from './copy';

export const metadata: Metadata = {
  title: aioCopy.metadata.title,
  description: aioCopy.metadata.description,
  openGraph: {
    title: aioCopy.metadata.title,
    description: aioCopy.metadata.description,
    url: '/aio',
    siteName: 'AIO Hub',
    type: 'website',
    images: [
      {
        url: '/aio/og.png',
        width: 1200,
        height: 630,
        alt: aioCopy.metadata.title,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: aioCopy.metadata.title,
    description: aioCopy.metadata.description,
    images: ['/aio/og.png'],
  },
};

export default function AIOPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: aioCopy.metadata.title,
    description: aioCopy.metadata.description,
    url: 'https://aiohub.jp/aio',
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
          name: 'AIO Hubとは',
          item: 'https://aiohub.jp/aio',
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