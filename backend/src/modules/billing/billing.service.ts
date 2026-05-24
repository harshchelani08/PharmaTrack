import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaClient, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private prisma = new PrismaClient();
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_API_KEY || 'dummy_key', {
      apiVersion: '2024-04-10' as any,
    });
  }

  /**
   * Generates a Stripe Checkout session URL for upgrading/subscribing
   */
  async createCheckoutSession(tenantId: string, plan: SubscriptionPlan): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscriptions: true },
    });

    if (!tenant) {
      throw new HttpException('Tenant context invalid.', HttpStatus.NOT_FOUND);
    }

    // Map pricing models from environment properties
    let priceId = '';
    switch (plan) {
      case SubscriptionPlan.STARTER:
        priceId = process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_mock';
        break;
      case SubscriptionPlan.PROFESSIONAL:
        priceId = process.env.STRIPE_PRO_PRICE_ID || 'price_pro_mock';
        break;
      case SubscriptionPlan.ENTERPRISE:
        priceId = process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_mock';
        break;
      default:
        throw new HttpException('Plan type not supported.', HttpStatus.BAD_REQUEST);
    }

    // Construct metadata
    const activeSub = tenant.subscriptions[0];
    const customerId = activeSub?.stripeCustId;

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId || undefined,
      customer_email: customerId ? undefined : `billing@${tenant.subdomain}.pharmatrack.in`,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `https://${tenant.subdomain}.pharmatrack.in/settings/billing?status=success`,
      cancel_url: `https://${tenant.subdomain}.pharmatrack.in/settings/billing?status=canceled`,
      metadata: {
        tenantId: tenant.id,
        planType: plan,
      },
    });

    return session.url || '';
  }

  /**
   * Processes signed Stripe Webhooks (Payment confirmations, subscription events)
   */
  async handleWebhook(signature: string, rawBody: Buffer): Promise<void> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      throw new HttpException(`Webhook signature verification failed: ${err.message}`, HttpStatus.BAD_REQUEST);
    }

    const session = event.data.object as any;

    switch (event.type) {
      case 'checkout.session.completed': {
        const tenantId = session.metadata?.tenantId;
        const plan = session.metadata?.planType as SubscriptionPlan;
        const stripeSubId = session.subscription as string;
        const stripeCustId = session.customer as string;

        if (tenantId) {
          await this.prisma.subscription.upsert({
            where: { stripeSubId },
            update: {
              status: SubscriptionStatus.ACTIVE,
              plan,
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Extends 30 Days
            },
            create: {
              tenantId,
              stripeCustId,
              stripeSubId,
              plan,
              status: SubscriptionStatus.ACTIVE,
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const stripeSubId = session.id as string;
        await this.prisma.subscription.updateMany({
          where: { stripeSubId },
          data: { status: SubscriptionStatus.CANCELED },
        });
        break;
      }

      case 'invoice.payment_failed': {
        const stripeSubId = session.subscription as string;
        await this.prisma.subscription.updateMany({
          where: { stripeSubId },
          data: { status: SubscriptionStatus.PAST_DUE },
        });
        break;
      }
    }
  }

  /**
   * Asserts usage policies. Throws an exception if tenant exceeds allowed capacity.
   */
  async assertTenantLimits(tenantId: string, action: 'CREATE_BRANCH' | 'RECORD_SALE'): Promise<void> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    const activePlan = subscription?.plan || SubscriptionPlan.FREE_TRIAL;
    const status = subscription?.status || SubscriptionStatus.ACTIVE;

    if (status === SubscriptionStatus.CANCELED || status === SubscriptionStatus.PAST_DUE) {
      throw new HttpException(
        'Billing Action Required: Your corporate subscription has expired or payment failed.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    if (action === 'CREATE_BRANCH') {
      const branchCount = await this.prisma.branch.count({
        where: { tenantId, deletedAt: null },
      });

      if (activePlan === SubscriptionPlan.FREE_TRIAL && branchCount >= 1) {
        throw new HttpException(
          'Upgrade Required: Free Trial plan supports maximum 1 branch locations.',
          HttpStatus.PAYMENT_REQUIRED,
        );
      }

      if (activePlan === SubscriptionPlan.STARTER && branchCount >= 1) {
        throw new HttpException(
          'Upgrade Required: Starter plan supports maximum 1 branch locations.',
          HttpStatus.PAYMENT_REQUIRED,
        );
      }

      if (activePlan === SubscriptionPlan.PROFESSIONAL && branchCount >= 5) {
        throw new HttpException(
          'Upgrade Required: Professional plan supports maximum 5 branch locations. Contact sales for Enterprise scaling.',
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
    }
  }
}
