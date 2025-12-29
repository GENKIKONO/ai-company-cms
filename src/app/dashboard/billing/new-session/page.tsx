import CheckoutSessionManager from './CheckoutSessionManager';

export default async function NewSessionPage() {
  // Note: In production, implement proper server-side auth checks

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Checkout Session Management
        </h1>
        <p className="mt-2 text-gray-600">
          Create and manage Stripe checkout sessions with setup fees
        </p>
      </div>

      <CheckoutSessionManager />
    </div>
  );
}
