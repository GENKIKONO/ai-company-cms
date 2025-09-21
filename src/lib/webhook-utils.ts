import { supabaseAdmin } from './supabase-server';

export interface WebhookEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  processed: boolean;
  retry_count: number;
  last_attempt: string;
  error_message?: string;
  event_data: any;
}

export class WebhookProcessor {
  private readonly maxRetries = 3;
  private readonly baseRetryDelay = 60000; // 1分

  async processFailedEvents(): Promise<{ processed: number; failed: number }> {
    const supabase = supabaseAdmin();
    
    // 失敗したイベントを取得（リトライ回数が最大に達していないもの）
    const { data: failedEvents, error } = await supabase
      .from('webhook_events')
      .select('*')
      .eq('processed', false)
      .lt('retry_count', this.maxRetries)
      .order('created_at', { ascending: true })
      .limit(10); // 一度に10個まで処理

    if (error) {
      console.error('Error fetching failed webhook events:', error);
      return { processed: 0, failed: 0 };
    }

    if (!failedEvents || failedEvents.length === 0) {
      return { processed: 0, failed: 0 };
    }

    let processedCount = 0;
    let failedCount = 0;

    for (const event of failedEvents) {
      // 最後の試行から十分な時間が経過しているかチェック
      const lastAttempt = new Date(event.last_attempt);
      const now = new Date();
      const timeSinceLastAttempt = now.getTime() - lastAttempt.getTime();
      const requiredDelay = this.baseRetryDelay * Math.pow(2, event.retry_count);

      if (timeSinceLastAttempt < requiredDelay) {
        console.log(`Skipping event ${event.stripe_event_id}, not enough time since last attempt`);
        continue;
      }

      try {
        const success = await this.retryWebhookEvent(event);
        if (success) {
          processedCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error(`Error retrying webhook event ${event.stripe_event_id}:`, error);
        failedCount++;
      }
    }

    return { processed: processedCount, failed: failedCount };
  }

  private async retryWebhookEvent(event: WebhookEvent): Promise<boolean> {
    const supabase = supabaseAdmin();
    
    try {
      // リトライ回数を増加
      const newRetryCount = event.retry_count + 1;
      
      await supabase
        .from('webhook_events')
        .update({
          retry_count: newRetryCount,
          last_attempt: new Date().toISOString(),
        })
        .eq('id', event.id);

      // イベントを再処理
      const success = await this.processEventByType(event.event_type, event.event_data);

      if (success) {
        // 成功した場合、処理済みとしてマーク
        await supabase
          .from('webhook_events')
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
            error_message: null,
          })
          .eq('id', event.id);

        console.log(`Successfully retried webhook event ${event.stripe_event_id}`);
        return true;
      } else {
        // 失敗した場合
        if (newRetryCount >= this.maxRetries) {
          // 最大リトライ回数に達した場合、処理済みとしてマーク
          await supabase
            .from('webhook_events')
            .update({
              processed: true,
              error_message: `Max retries (${this.maxRetries}) exceeded`,
            })
            .eq('id', event.id);

          console.log(`Webhook event ${event.stripe_event_id} exceeded max retries`);
        }

        return false;
      }
    } catch (error) {
      console.error(`Error retrying webhook event ${event.stripe_event_id}:`, error);
      
      // エラーメッセージを記録
      await supabase
        .from('webhook_events')
        .update({
          error_message: error instanceof Error ? error.message : 'Unknown error during retry',
        })
        .eq('id', event.id);

      return false;
    }
  }

  private async processEventByType(eventType: string, eventData: any): Promise<boolean> {
    // この部分は webhook route.ts の処理と同じロジックを使用
    // 実際の実装では、共通の処理関数を作成することを推奨
    
    switch (eventType) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        return await this.handleSubscriptionChange(eventData.object);

      case 'customer.subscription.deleted':
        return await this.handleSubscriptionDeleted(eventData.object);

      case 'invoice.payment_succeeded':
        return await this.handlePaymentSucceeded(eventData.object);

      case 'invoice.payment_failed':
        return await this.handlePaymentFailed(eventData.object);

      default:
        console.log(`Unhandled event type in retry: ${eventType}`);
        return true; // 未対応イベントは成功として扱う
    }
  }

  // 以下のメソッドはwebhook route.tsの関数と同じ実装
  private async handleSubscriptionChange(subscription: any): Promise<boolean> {
    try {
      const supabase = supabaseAdmin();
      const organizationId = subscription.metadata.organization_id;

      if (!organizationId) {
        return false;
      }

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
          status = 'active';
          break;
        default:
          status = 'pending';
      }

      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          org_id: organizationId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer,
          status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'stripe_subscription_id'
        });

      if (error) {
        return false;
      }

      if (status === 'active') {
        await supabase
          .from('organizations')
          .update({ status: 'published' })
          .eq('id', organizationId)
          .in('status', ['draft', 'paused']);
      } else if (status === 'paused') {
        await supabase
          .from('organizations')
          .update({ status: 'paused' })
          .eq('id', organizationId)
          .eq('status', 'published');
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  private async handleSubscriptionDeleted(subscription: any): Promise<boolean> {
    try {
      const supabase = supabaseAdmin();
      const organizationId = subscription.metadata.organization_id;

      if (!organizationId) {
        return false;
      }

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        return false;
      }

      await supabase
        .from('organizations')
        .update({ status: 'paused' })
        .eq('id', organizationId);

      return true;
    } catch (error) {
      return false;
    }
  }

  private async handlePaymentSucceeded(invoice: any): Promise<boolean> {
    return true; // 支払い成功時は特別な処理なし
  }

  private async handlePaymentFailed(invoice: any): Promise<boolean> {
    try {
      const supabase = supabaseAdmin();
      
      if (typeof invoice.customer === 'string') {
        const { data: customer } = await supabase
          .from('stripe_customers')
          .select('organization_id')
          .eq('stripe_customer_id', invoice.customer)
          .maybeSingle();

        if (customer) {
          await supabase
            .from('organizations')
            .update({ status: 'paused' })
            .eq('id', customer.organization_id);
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}

export const webhookProcessor = new WebhookProcessor();