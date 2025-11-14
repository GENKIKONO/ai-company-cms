'use client';

import { AlertTriangle, Lock } from 'lucide-react';

interface AccountStatusBannerProps {
  status: 'warned' | 'suspended';
}

export function AccountStatusBanner({ status }: AccountStatusBannerProps) {
  if (status === 'warned') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Account Warning
            </h3>
            <div className="mt-1 text-sm text-yellow-700">
              <p>
                Your account has received a warning. Please check your notifications
                or contact your organization administrator for more details.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'suspended') {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Lock className="h-5 w-5 text-orange-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-orange-800">
              Account Suspended
            </h3>
            <div className="mt-1 text-sm text-orange-700">
              <p>
                Your account is currently suspended. All content is set to private
                and some features may be limited. Contact your organization administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}