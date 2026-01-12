'use client';

import { DashboardPageShell } from '@/components/dashboard';
import CheckoutSessionManager from './CheckoutSessionManager';

export default function NewSessionPage() {
  return (
    <DashboardPageShell
      title="Checkout Session Management"
      requiredRole="admin"
    >
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
            Checkout Session Management
          </h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Create and manage Stripe checkout sessions with setup fees
          </p>
        </div>

        <CheckoutSessionManager />
      </div>
    </DashboardPageShell>
  );
}
