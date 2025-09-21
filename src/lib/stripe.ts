import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export interface StripeProductConfig {
  setupFee: {
    amount: number; // 円単位
    name: string;
    description: string;
  };
  monthlyFee: {
    amount: number; // 円単位
    name: string; 
    description: string;
  };
}

export const LUXUCARE_PRODUCT_CONFIG: StripeProductConfig = {
  setupFee: {
    amount: 50000, // 50,000円
    name: 'LuxuCare CMS 初期設定費',
    description: '企業情報CMS初期設定・導入サポート費用',
  },
  monthlyFee: {
    amount: 9800, // 9,800円
    name: 'LuxuCare CMS 月額利用料',
    description: '企業情報CMS月額利用料・保守・サポート',
  },
};

export async function createLuxuCareProducts(): Promise<{
  setupProduct: Stripe.Product;
  setupPrice: Stripe.Price;
  monthlyProduct: Stripe.Product;
  monthlyPrice: Stripe.Price;
}> {
  try {
    // 初期費用商品を作成
    const setupProduct = await stripe.products.create({
      name: LUXUCARE_PRODUCT_CONFIG.setupFee.name,
      description: LUXUCARE_PRODUCT_CONFIG.setupFee.description,
      type: 'service',
      metadata: {
        type: 'setup_fee',
        service: 'luxucare_cms',
      },
    });

    // 初期費用価格を作成（一回限り）
    const setupPrice = await stripe.prices.create({
      product: setupProduct.id,
      unit_amount: LUXUCARE_PRODUCT_CONFIG.setupFee.amount,
      currency: 'jpy',
      metadata: {
        type: 'setup_fee',
      },
    });

    // 月額費用商品を作成
    const monthlyProduct = await stripe.products.create({
      name: LUXUCARE_PRODUCT_CONFIG.monthlyFee.name,
      description: LUXUCARE_PRODUCT_CONFIG.monthlyFee.description,
      type: 'service',
      metadata: {
        type: 'monthly_fee',
        service: 'luxucare_cms',
      },
    });

    // 月額費用価格を作成（月次請求）
    const monthlyPrice = await stripe.prices.create({
      product: monthlyProduct.id,
      unit_amount: LUXUCARE_PRODUCT_CONFIG.monthlyFee.amount,
      currency: 'jpy',
      recurring: {
        interval: 'month',
        interval_count: 1,
      },
      metadata: {
        type: 'monthly_fee',
      },
    });

    return {
      setupProduct,
      setupPrice,
      monthlyProduct,
      monthlyPrice,
    };

  } catch (error) {
    console.error('Error creating Stripe products:', error);
    throw error;
  }
}

export async function getLuxuCareProducts(): Promise<{
  setupPrice: Stripe.Price | null;
  monthlyPrice: Stripe.Price | null;
}> {
  try {
    // 既存の商品を検索
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });

    let setupPrice: Stripe.Price | null = null;
    let monthlyPrice: Stripe.Price | null = null;

    for (const price of prices.data) {
      const product = price.product as Stripe.Product;
      if (product.metadata?.service === 'luxucare_cms') {
        if (product.metadata?.type === 'setup_fee') {
          setupPrice = price;
        } else if (product.metadata?.type === 'monthly_fee') {
          monthlyPrice = price;
        }
      }
    }

    return { setupPrice, monthlyPrice };
  } catch (error) {
    console.error('Error fetching Stripe products:', error);
    throw error;
  }
}

export async function createSubscriptionForOrganization(
  organizationId: string,
  customerId: string,
  monthlyPriceId: string,
  setupPriceId?: string
): Promise<{
  subscription: Stripe.Subscription;
  invoice?: Stripe.Invoice;
}> {
  try {
    // サブスクリプション作成
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: monthlyPriceId,
          quantity: 1,
        },
      ],
      metadata: {
        organization_id: organizationId,
        service: 'luxucare_cms',
      },
      // 最初の請求は即座に実行
      billing_cycle_anchor: Math.floor(Date.now() / 1000),
    });

    let invoice: Stripe.Invoice | undefined;

    // 初期費用が指定されている場合は別途請求書作成
    if (setupPriceId) {
      invoice = await stripe.invoices.create({
        customer: customerId,
        metadata: {
          organization_id: organizationId,
          type: 'setup_fee',
        },
        auto_advance: true, // 自動で最終化
      });

      // 初期費用をインボイスに追加
      await stripe.invoiceItems.create({
        customer: customerId,
        price: setupPriceId,
        quantity: 1,
        invoice: invoice.id,
      });

      // インボイスを最終化して送信
      invoice = await stripe.invoices.finalizeInvoice(invoice.id);
    }

    return { subscription, invoice };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

export async function createStripeCustomer(
  email: string,
  organizationName: string,
  organizationId: string
): Promise<Stripe.Customer> {
  try {
    const customer = await stripe.customers.create({
      email,
      name: organizationName,
      metadata: {
        organization_id: organizationId,
        service: 'luxucare_cms',
      },
    });

    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
}

export function formatJPYAmount(amount: number): string {
  return `¥${amount.toLocaleString()}`;
}