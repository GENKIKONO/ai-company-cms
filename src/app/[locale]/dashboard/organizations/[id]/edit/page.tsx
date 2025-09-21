import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import OrganizationCRUD from '@/components/OrganizationCRUD';
import { generateMetadata as generateLocalizedMetadata } from '@/lib/metadata';
import { Locale } from '@/i18n';
import { supabaseServer } from '@/lib/supabase-server';

export async function generateMetadata({ 
  params: { locale, id } 
}: { 
  params: { locale: Locale; id: string } 
}): Promise<Metadata> {
  const t = await getTranslations();
  const supabase = supabaseServer();
  
  const { data: organization } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', id)
    .single();

  const title = organization 
    ? `${t('crud.editOrganization')}: ${organization.name} | LuxuCare`
    : `${t('crud.editOrganization')} | LuxuCare`;

  return generateLocalizedMetadata(
    locale,
    title,
    t('crud.meta.editDescription')
  );
}

interface Props {
  params: {
    locale: Locale;
    id: string;
  };
}

export default async function EditOrganizationPage({ params: { locale, id } }: Props) {
  // Verify organization exists
  const supabase = supabaseServer();
  const { data: organization, error } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', id)
    .single();

  if (error || !organization) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OrganizationCRUD locale={locale} organizationId={id} />
    </div>
  );
}