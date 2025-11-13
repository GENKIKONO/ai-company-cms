'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CheckoutRequest {
  organization_id: string;
  setup_fee_amount: number;
  notes: string;
  plan_type: 'with_setup' | 'monthly_only';
}

export default function CheckoutSessionManager() {
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
        throw new Error(data.error || 'Failed to create checkout session');
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
      <Card>
        <CardHeader>
          <CardTitle>Create Checkout Session</CardTitle>
          <CardDescription>
            Generate a Stripe checkout session with optional setup fee
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="organization_id">Organization ID</Label>
              <Input
                id="organization_id"
                type="text"
                value={formData.organization_id}
                onChange={(e) => setFormData(prev => ({ ...prev, organization_id: e.target.value }))}
                placeholder="Enter organization UUID"
                required
              />
            </div>

            <div className="space-y-4">
              <Label>Plan Type</Label>
              <RadioGroup
                value={formData.plan_type}
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, plan_type: value as 'with_setup' | 'monthly_only' }))
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="with_setup" id="with_setup" />
                  <Label htmlFor="with_setup" className="cursor-pointer">
                    Setup Fee + Monthly Subscription
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="monthly_only" id="monthly_only" />
                  <Label htmlFor="monthly_only" className="cursor-pointer">
                    Monthly Subscription Only
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {formData.plan_type === 'with_setup' && (
              <div className="space-y-2">
                <Label htmlFor="setup_fee">Setup Fee Amount (JPY)</Label>
                <Input
                  id="setup_fee"
                  type="number"
                  min="1000"
                  step="1000"
                  value={formData.setup_fee_amount}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    setup_fee_amount: parseInt(e.target.value) || 0 
                  }))}
                  required
                />
                <p className="text-sm text-gray-500">
                  Preview: {formatCurrency(formData.setup_fee_amount)}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes about this subscription..."
                rows={3}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Checkout Summary</h4>
              <div className="space-y-1 text-sm text-gray-600">
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
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>First Payment:</span>
                    <span>{formatCurrency(formData.setup_fee_amount + 10000)}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button 
              type="submit" 
              disabled={loading || !formData.organization_id}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create Checkout Session'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}