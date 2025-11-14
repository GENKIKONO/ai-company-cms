import { Lock } from 'lucide-react';

interface AccountRestrictedMessageProps {
  status: 'frozen';
}

export function AccountRestrictedMessage({ status }: AccountRestrictedMessageProps) {
  const title = 'Account Frozen';
  const message = 'Your account has been frozen.';

  return (
    <div className="min-h-screen bg-[var(--aio-page-bg, #f3f4f6)] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-6">
          <Lock className="h-6 w-6 text-red-600" aria-hidden="true" />
        </div>
        
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          {title}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {message} Your account is currently restricted and you cannot access dashboard features.
        </p>
        
        <p className="text-sm text-gray-500">
          Please contact support or your organization administrator for assistance.
        </p>
      </div>
    </div>
  );
}