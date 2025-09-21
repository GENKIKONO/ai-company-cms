import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Organization } from '@/types';
import CollaborativeOrganizationForm from '@/components/collaboration/CollaborativeOrganizationForm';
import { PencilIcon } from '@heroicons/react/24/outline';

interface OrganizationPageProps {
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

export async function generateMetadata({ params }: OrganizationPageProps) {
  const organization = await getOrganization(params.id);
  
  if (!organization) {
    return {
      title: '組織が見つかりません - LuxuCare',
    };
  }

  return {
    title: `${organization.name} - LuxuCare`,
    description: organization.description || `${organization.name}の詳細情報`,
  };
}

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  const organization = await getOrganization(params.id);

  if (!organization) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header with edit button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
            <p className="text-gray-600 mt-2">組織詳細情報</p>
          </div>
          
          <Link
            href={`/organizations/${organization.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            <PencilIcon className="w-4 h-4 mr-2" />
            リアルタイム編集
          </Link>
        </div>

        {/* Organization form in view mode */}
        <CollaborativeOrganizationForm 
          organization={organization} 
          isEditing={false}
        />
      </div>
    </div>
  );
}