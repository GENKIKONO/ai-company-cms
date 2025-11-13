import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';

import { logger } from '@/lib/log';
// Stripe Webhook イベント型定義
const StripeWebhookSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.any()
  }),
  created: z.number()
});

// 処理済みイベント用ストレージ（Redis推奨、ここはメモリ実装）
const processedEvents = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    // 1. Raw body取得
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      );
    }

    // 2. 署名検証
    if (!verifyStripeSignature(body, signature)) {
      logger.error('Invalid Stripe signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // 3. JSONパース & バリデーション
    const event = JSON.parse(body);
    const validationResult = StripeWebhookSchema.safeParse(event);
    
    if (!validationResult.success) {
      logger.error('Invalid webhook payload:', validationResult.error);
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    const webhookEvent = validationResult.data;

    // 4. 重複処理防止
    if (processedEvents.has(webhookEvent.id)) {
      logger.info(`Event ${webhookEvent.id} already processed`);
      return NextResponse.json({ received: true });
    }

    // 5. イベント種別ホワイトリスト
    const allowedEvents = [
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed'
    ];

    if (!allowedEvents.includes(webhookEvent.type)) {
      logger.warn(`Unhandled event type: ${webhookEvent.type}`);
      return NextResponse.json({ received: true });
    }

    // 6. イベント処理
    await processStripeEvent(webhookEvent);

    // 7. 処理済みマーク
    processedEvents.add(webhookEvent.id);

    // 8. 古い処理済みイベントをクリーンアップ（メモリリーク防止）
    if (processedEvents.size > 10000) {
      const toDelete = Array.from(processedEvents).slice(0, 5000);
      toDelete.forEach(id => processedEvents.delete(id));
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    logger.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

function verifyStripeSignature(payload: string, signature: string): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    logger.error('STRIPE_WEBHOOK_SECRET not configured');
    return false;
  }

  try {
    const elements = signature.split(',');
    const signatureElements = elements.reduce((acc, element) => {
      const [key, value] = element.split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const timestamp = signatureElements.t;
    const signatures = [signatureElements.v1].filter(Boolean);

    if (!timestamp || signatures.length === 0) {
      return false;
    }

    // タイムスタンプ検証（5分以内）
    const timestampMs = parseInt(timestamp) * 1000;
    const now = Date.now();
    if (Math.abs(now - timestampMs) > 5 * 60 * 1000) {
      logger.error('Webhook timestamp too old');
      return false;
    }

    // 署名検証
    const signedPayload = timestamp + '.' + payload;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    return signatures.some(signature =>
      crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      )
    );

  } catch (error) {
    logger.error('Signature verification error:', error);
    return false;
  }
}

async function processStripeEvent(event: any): Promise<void> {
  const supabase = createServiceRoleClient();

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionEvent(supabase, event);
      break;
      
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(supabase, event);
      break;
      
    case 'invoice.payment_failed':
      await handlePaymentFailed(supabase, event);
      break;
      
    default:
      logger.warn(`Unhandled event type: ${event.type}`);
  }
}

async function handleSubscriptionEvent(supabase: any, event: any): Promise<void> {
  const subscription = event.data.object;
  
  // 組織の課金状態更新
  const { error } = await supabase
    .from('organizations')
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      plan_type: subscription.items.data[0]?.price?.lookup_key || 'starter',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', subscription.customer);

  if (error) {
    logger.error('Failed to update organization subscription:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(supabase: any, event: any): Promise<void> {
  const invoice = event.data.object;
  
  // 支払い記録を保存 - テーブルが存在しない場合は警告のみ
  try {
    const { error } = await supabase
      .from('payment_history')
      .insert({
        stripe_invoice_id: invoice.id,
        stripe_customer_id: invoice.customer,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        created_at: new Date(invoice.created * 1000).toISOString()
      });

    if (error && error.code === '42P01') {
      logger.warn('payment_history table does not exist, skipping insert');
    } else if (error) {
      logger.error('Failed to record payment:', error);
      throw error;
    }
  } catch (error) {
    logger.warn('Payment history logging failed:', error);
  }
}

async function handlePaymentFailed(supabase: any, event: any): Promise<void> {
  const invoice = event.data.object;
  
  // 失敗通知やサスペンド処理
  logger.warn(`Payment failed for customer: ${invoice.customer}`);
  
  // 組織の状態更新
  const { error } = await supabase
    .from('organizations')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', invoice.customer);

  if (error) {
    logger.error('Failed to update organization on payment failure:', error);
  }
}

function createServiceRoleClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}