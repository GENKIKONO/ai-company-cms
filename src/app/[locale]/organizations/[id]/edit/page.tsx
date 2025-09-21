import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Organization } from '@/types';
import CollaborativeOrganizationForm from '@/components/collaboration/CollaborativeOrganizationForm';

interface EditOrganizationPageProps {
  params: {
    id: string;
  };
}

async function getOrganization(id: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function generateMetadata({ params }: EditOrganizationPageProps) {
  const organization = await getOrganization(params.id);
  
  if (!organization) {
    return {
      title: '組織が見つかりません - LuxuCare',
    };
  }

  return {
    title: `${organization.name}を編集 - LuxuCare`,
    description: `${organization.name}の情報をリアルタイム共同編集で更新`,
  };
}

export default async function EditOrganizationPage({ params }: EditOrganizationPageProps) {
  const organization = await getOrganization(params.id);

  if (!organization) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <CollaborativeOrganizationForm 
        organization={organization} 
        isEditing={true}
      />
    </div>
  );
}