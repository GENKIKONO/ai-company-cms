import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe, verifyWebhookSignature, updateSubscriptionInDB } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

interface WebhookProcessingResult {
  success: boolean;
  processed: boolean;
  error?: string;
  retryAfter?: number;
}

async function processWebhookEvent(event: Stripe.Event): Promise<WebhookProcessingResult> {
  const supabaseBrowser = supabaseBrowserAdmin();
  const startTime = Date.now();

  return SentryUtils.withTransaction(
    `webhook.${event.type}`,
    'webhook.process',
    async (transaction) => {
      transaction.setTag('event.type', event.type);
      transaction.setTag('event.id', event.id);
      
      SentryUtils.addBreadcrumb(
        `Processing webhook: ${event.type}`,
        'webhook',
        { eventId: event.id }
      );

  try {
    // イベントの冪等性チェック
    const { data: existingEvent, error: checkError } = await supabaseBrowser
      .from('webhook_events')
      .select('id, processed, retry_count')
      .eq('stripe_event_id', event.id)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking webhook event:', checkError);
      return { success: false, processed: false, error: 'Database error' };
    }

    // 既に処理済みの場合はスキップ
    if (existingEvent?.processed) {
      console.log(`Event ${event.id} already processed, skipping`);
      return { success: true, processed: true };
    }

    // イベントレコードを挿入または更新
    const retryCount = existingEvent?.retry_count || 0;
    
    const { error: upsertError } = await supabaseBrowser
      .from('webhook_events')
      .upsert({
        stripe_event_id: event.id,
        event_type: event.type,
        processed: false,
        retry_count: retryCount,
        last_attempt: new Date().toISOString(),
        event_data: event.data,
      }, {
        onConflict: 'stripe_event_id'
      });

    if (upsertError) {
      console.error('Error upserting webhook event:', upsertError);
      return { success: false, processed: false, error: 'Failed to record event' };
    }

    // イベント処理
    let processingSuccess = false;
    let errorMessage = '';

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        processingSuccess = await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        processingSuccess = await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        processingSuccess = await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        processingSuccess = await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'checkout.session.completed':
        processingSuccess = await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
        processingSuccess = true; // 未対応イベントは成功として扱う
    }

    if (processingSuccess) {
      // 処理成功をマーク
      await supabaseBrowser
        .from('webhook_events')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
        })
        .eq('stripe_event_id', event.id);

      const processingTime = Date.now() - startTime;
      SentryUtils.trackWebhookEvent(event.type, true, {
        eventId: event.id,
        processingTime,
      });

      return { success: true, processed: true };
    } else {
      // リトライ回数を増加
      const newRetryCount = retryCount + 1;
      await supabaseBrowser
        .from('webhook_events')
        .update({
          retry_count: newRetryCount,
          error_message: errorMessage,
        })
        .eq('stripe_event_id', event.id);

      // 最大リトライ回数チェック
      if (newRetryCount >= 3) {
        await supabaseBrowser
          .from('webhook_events')
          .update({
            processed: true, // 失敗として処理完了扱い
            error_message: `Max retries exceeded: ${errorMessage}`,
          })
          .eq('stripe_event_id', event.id);
        
        return { success: false, processed: true, error: 'Max retries exceeded' };
      }

      // リトライの場合は指数バックオフ
      const retryAfter = Math.pow(2, newRetryCount) * 60; // 2分、4分、8分
      
      const processingTime = Date.now() - startTime;
      SentryUtils.trackWebhookEvent(event.type, false, {
        eventId: event.id,
        retryCount: newRetryCount,
        processingTime,
      });
      
      return { success: false, processed: false, retryAfter };
    }

  } catch (error) {
    console.error('Error processing webhook event:', error);
    
    const processingTime = Date.now() - startTime;
    SentryUtils.trackWebhookEvent(event.type, false, {
      eventId: event.id,
      processingTime,
    });
    
    if (error instanceof Error) {
      SentryUtils.captureException(error, {
        webhook: {
          eventType: event.type,
          eventId: event.id,
          processingTime,
        },
      });
    }
    
    return { success: false, processed: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
    },
    {
      webhook: {
        eventType: event.type,
        eventId: event.id,
      },
    }
  );
}

async function handleSubscriptionChange(subscription: Stripe.Subscription): Promise<boolean> {
  try {
    const supabaseBrowser = supabaseBrowserAdmin();
    const organizationId = subscription.metadata.organization_id;

    if (!organizationId) {
      console.error('No organization_id in subscription metadata');
      return false;
    }

    // サブスクリプション状態をマッピング
    let status: string;
    switch (subscription.status) {
      case 'active':
        status = 'active';
        break;
      case 'canceled':
      case 'unpaid':
        status = 'paused';
        break;
      case 'trialing':
        status = 'active'; // トライアルも active として扱う
        break;
      default:
        status = 'pending';
    }

    // サブスクリプション情報を更新
    const { error } = await supabaseBrowser
      .from('subscriptions')
      .upsert({
        org_id: organizationId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'stripe_subscription_id'
      });

    if (error) {
      console.error('Error updating subscription:', error);
      return false;
    }

    // 組織のステータスも更新
    if (status === 'active') {
      await supabaseBrowser
        .from('organizations')
        .update({ status: 'published' })
        .eq('id', organizationId)
        .in('status', ['draft', 'paused']); // draft または paused の場合のみ published に変更
    } else if (status === 'paused') {
      await supabaseBrowser
        .from('organizations')
        .update({ status: 'paused' })
        .eq('id', organizationId)
        .eq('status', 'published'); // published の場合のみ paused に変更
    }

    console.log(`Subscription ${subscription.id} updated to status: ${status}`);
    return true;

  } catch (error) {
    console.error('Error handling subscription change:', error);
    return false;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<boolean> {
  try {
    const supabaseBrowser = supabaseBrowserAdmin();
    const organizationId = subscription.metadata.organization_id;

    if (!organizationId) {
      console.error('No organization_id in subscription metadata');
      return false;
    }

    // サブスクリプションを無効化
    const { error: subError } = await supabaseBrowser
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (subError) {
      console.error('Error updating cancelled subscription:', subError);
      return false;
    }

    // 組織を一時停止状態に変更
    await supabaseBrowser
      .from('organizations')
      .update({ status: 'paused' })
      .eq('id', organizationId);

    console.log(`Subscription ${subscription.id} cancelled`);
    return true;

  } catch (error) {
    console.error('Error handling subscription deletion:', error);
    return false;
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<boolean> {
  try {
    console.log(`Payment succeeded for invoice ${invoice.id}`);
    // 必要に応じて支払い成功時の処理を追加
    return true;
  } catch (error) {
    console.error('Error handling payment success:', error);
    return false;
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<boolean> {
  try {
    console.log(`Payment failed for invoice ${invoice.id}`);
    
    const supabaseBrowser = supabaseBrowserAdmin();
    
    // 顧客からorganization_idを取得
    if (typeof invoice.customer === 'string') {
      const { data: customer } = await supabaseBrowser
        .from('stripe_customers')
        .select(`
          organization_id,
          email,
          organization:organizations(id, name, created_by)
        `)
        .eq('stripe_customer_id', invoice.customer)
        .maybeSingle();

      if (customer?.organization) {
        // 支払い失敗の場合、組織を一時停止に
        await supabaseBrowser
          .from('organizations')
          .update({ status: 'paused' })
          .eq('id', customer.organization_id);

        // ユーザー情報を取得してメール送信
        const orgData = customer.organization as any;
        const { data: user } = await supabaseBrowser
          .from('users')
          .select('email, full_name')
          .eq('id', orgData.created_by)
          .maybeSingle();

        if (user) {
          // 支払い失敗メールを送信
          await sendPaymentFailedEmail(
            user.email,
            user.full_name || user.email,
            orgData.name
          );
          console.log(`Payment failed email sent to ${user.email}`);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error handling payment failure:', error);
    return false;
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<boolean> {
  try {
    const supabaseBrowser = supabaseBrowserAdmin();
    const organizationId = session.metadata?.organization_id;
    const setupFeeAmount = parseInt(session.metadata?.setup_fee_amount || '0');
    const planType = session.metadata?.plan_type;
    const notes = session.metadata?.notes;

    if (!organizationId) {
      console.error('No organization_id in checkout session metadata');
      return false;
    }

    // Get the subscription from the session
    const subscriptionId = session.subscription as string;
    if (!subscriptionId) {
      console.error('No subscription ID in checkout session');
      return false;
    }

    // Retrieve subscription from Stripe to get details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Update stripe_customers table with email if provided
    if (session.customer_details?.email) {
      await supabaseBrowser
        .from('stripe_customers')
        .update({
          email: session.customer_details.email,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', session.customer)
        .eq('organization_id', organizationId);
    }

    // Create or update subscription record
    const subscriptionData = {
      org_id: organizationId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status === 'active' ? 'active' : 'pending',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      setup_fee_amount: setupFeeAmount > 0 ? setupFeeAmount : null,
      setup_fee_paid_at: setupFeeAmount > 0 ? new Date().toISOString() : null,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    };

    const { error: subError } = await supabaseBrowser
      .from('subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'stripe_subscription_id'
      });

    if (subError) {
      console.error('Error creating/updating subscription:', subError);
      return false;
    }

    // Update organization status to published if subscription is active
    if (subscription.status === 'active') {
      await supabaseBrowser
        .from('organizations')
        .update({ 
          status: 'published',
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId)
        .in('status', ['draft', 'paused']);
    }

    console.log(`Checkout session completed for organization ${organizationId}, subscription ${subscription.id}`);
    return true;

  } catch (error) {
    console.error('Error handling checkout session completion:', error);
    return false;
  }
}

// Single-Org Mode webhook handler (simplified)
async function handleSingleOrgWebhook(event: Stripe.Event): Promise<boolean> {
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          await updateSubscriptionInDB(session.subscription as string);
        }
        return true;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused':
      case 'customer.subscription.resumed':
        const subscription = event.data.object as Stripe.Subscription;
        await updateSubscriptionInDB(subscription.id);
        return true;

      default:
        console.log(`Unhandled Single-Org webhook event: ${event.type}`);
        return true; // Return true for unhandled events to acknowledge receipt
    }
  } catch (error) {
    console.error('Single-Org webhook processing error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const sig = headersList.get('stripe-signature');

    if (!sig) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Use the safe webhook verification function
    const event = verifyWebhookSignature(body, sig);
    
    if (!event) {
      // If verification fails or webhook secret is not configured
      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.warn('Webhook received but STRIPE_WEBHOOK_SECRET not configured');
        return NextResponse.json({ received: true, processed: false, warning: 'Webhook not configured' });
      }
      
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Process with Single-Org Mode handler
    const success = await handleSingleOrgWebhook(event);

    if (success) {
      return NextResponse.json({ received: true, processed: true });
    } else {
      return NextResponse.json(
        { error: 'Processing failed' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Webhook error:', error);
    
    // Use Sentry if available, otherwise just log
    if (typeof SentryUtils !== 'undefined') {
      SentryUtils.captureException(error);
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';