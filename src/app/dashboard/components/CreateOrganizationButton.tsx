'use client';

import { useRouter } from 'next/navigation';

export default function CreateOrganizationButton() {
  const router = useRouter();

  const handleCreateOrganization = () => {
    router.push('/organizations/new');
  };

  return (
    <button
      onClick={handleCreateOrganization}
      className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[var(--aio-primary)] hover:bg-[var(--aio-muted)] transition-colors"
    >
      <div className="p-2 bg-[var(--aio-muted)] rounded-lg mr-3">
        <svg className="w-6 h-6 text-[var(--aio-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <div className="text-left">
        <p className="font-medium text-gray-900">新しい企業を追加</p>
        <p className="text-sm text-gray-600">企業情報を登録して公開します</p>
      </div>
    </button>
  );
}