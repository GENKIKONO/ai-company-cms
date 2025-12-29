'use client';

import { useState } from 'react';
import { DashboardPageShell } from '@/components/dashboard';
import {
  DashboardCard,
  DashboardCardHeader,
  DashboardCardContent,
  DashboardCardFooter,
  DashboardButton,
  DashboardInput,
  DashboardTextarea,
  DashboardAlert,
} from '@/components/dashboard/ui';

interface CheckoutRequest {
  organization_id: string;
  setup_fee_amount: number;
  notes: string;
  plan_type: 'with_setup' | 'monthly_only';
}

export default function CheckoutSessionManager() {
  return (
    <DashboardPageShell title="チェックアウト管理" requiredRole="admin">
      <CheckoutSessionManagerContent />
    </DashboardPageShell>
  );
}

function CheckoutSessionManagerContent() {
  const [formData, setFormData] = useState<CheckoutRequest>({
    organization_id: '',
    setup_fee_amount: 50000, // Default 50,000 JPY
    notes: '',
    plan_type: 'with_setup'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/stripe/checkout/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Failed to create checkout session';
        setError(errorMessage);
        return;
      }

      if (data.checkout_url) {
        setSuccess('Checkout session created successfully');
        // Open checkout in new tab
        window.open(data.checkout_url, '_blank');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <DashboardCard>
        <DashboardCardHeader>
          <h2 className="text-xl font-semibold">Create Checkout Session</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Generate a Stripe checkout session with optional setup fee
          </p>
        </DashboardCardHeader>

        <form onSubmit={handleSubmit}>
          <DashboardCardContent className="space-y-6">
            {error && (
              <DashboardAlert variant="error">
                {error}
              </DashboardAlert>
            )}

            {success && (
              <DashboardAlert variant="success">
                {success}
              </DashboardAlert>
            )}

            <DashboardInput
              id="organization_id"
              label="Organization ID"
              type="text"
              value={formData.organization_id}
              onChange={(e) => setFormData(prev => ({ ...prev, organization_id: e.target.value }))}
              placeholder="Enter organization UUID"
              required
            />

            <div className="space-y-4">
              <label className="block text-sm font-medium text-[var(--color-text-primary)]">
                Plan Type
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="plan_type"
                    value="with_setup"
                    checked={formData.plan_type === 'with_setup'}
                    onChange={(e) => setFormData(prev => ({ ...prev, plan_type: e.target.value as 'with_setup' | 'monthly_only' }))}
                    className="h-4 w-4 text-[var(--aio-primary)] focus:ring-[var(--aio-primary)]"
                  />
                  <span className="text-sm text-[var(--color-text-primary)]">
                    Setup Fee + Monthly Subscription
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="plan_type"
                    value="monthly_only"
                    checked={formData.plan_type === 'monthly_only'}
                    onChange={(e) => setFormData(prev => ({ ...prev, plan_type: e.target.value as 'with_setup' | 'monthly_only' }))}
                    className="h-4 w-4 text-[var(--aio-primary)] focus:ring-[var(--aio-primary)]"
                  />
                  <span className="text-sm text-[var(--color-text-primary)]">
                    Monthly Subscription Only
                  </span>
                </label>
              </div>
            </div>

            {formData.plan_type === 'with_setup' && (
              <DashboardInput
                id="setup_fee"
                label="Setup Fee Amount (JPY)"
                type="number"
                min={1000}
                step={1000}
                value={formData.setup_fee_amount}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  setup_fee_amount: parseInt(e.target.value) || 0
                }))}
                description={`Preview: ${formatCurrency(formData.setup_fee_amount)}`}
                required
              />
            )}

            <DashboardTextarea
              id="notes"
              label="Notes (Optional)"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any notes about this subscription..."
              rows={3}
            />

            <div className="bg-[var(--color-surface-secondary)] p-4 rounded-lg">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">Checkout Summary</h4>
              <div className="space-y-1 text-sm text-[var(--color-text-secondary)]">
                {formData.plan_type === 'with_setup' && (
                  <div className="flex justify-between">
                    <span>Setup Fee:</span>
                    <span>{formatCurrency(formData.setup_fee_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Monthly Subscription:</span>
                  <span>¥10,000 /month</span>
                </div>
                {formData.plan_type === 'with_setup' && (
                  <div className="flex justify-between font-medium border-t border-[var(--color-border)] pt-1">
                    <span>First Payment:</span>
                    <span>{formatCurrency(formData.setup_fee_amount + 10000)}</span>
                  </div>
                )}
              </div>
            </div>
          </DashboardCardContent>

          <DashboardCardFooter>
            <DashboardButton
              type="submit"
              disabled={loading || !formData.organization_id}
              variant="primary"
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create Checkout Session'}
            </DashboardButton>
          </DashboardCardFooter>
        </form>
      </DashboardCard>
    </div>
  );
}