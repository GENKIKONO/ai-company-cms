import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import OrganizationCRUD from '@/components/OrganizationCRUD';
import { generateMetadata as generateLocalizedMetadata } from '@/lib/metadata';
import { Locale } from '@/i18n';

export async function generateMetadata({ params: { locale } }: { params: { locale: Locale } }): Promise<Metadata> {
  const t = await getTranslations();
  return generateLocalizedMetadata(
    locale,
    `${t('crud.createOrganization')} | LuxuCare`,
    t('crud.meta.createDescription')
  );
}

interface Props {
  params: {
    locale: Locale;
  };
}

export default async function CreateOrganizationPage({ params: { locale } }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      <OrganizationCRUD locale={locale} />
    </div>
  );
}