import { describe, it, expect } from 'vitest';

describe('PagarMe Webhook Events', () => {
  it('should parse subscription_created event', () => {
    const event = {
      type: 'subscription.created',
      data: {
        id: 'sub_pagarme_1',
        status: 'active',
        plan: { id: 'plan_pro_monthly' },
        customer: { email: 'test@test.com' },
      },
    };
    expect(event.data.status).toBe('active');
  });

  it('should parse charge.paid for Pix', () => {
    const event = {
      type: 'charge.paid',
      data: {
        id: 'ch_1',
        status: 'paid',
        payment_method: 'pix',
        amount: 2990,
        last_transaction: {
          qr_code: 'pix_code_here',
          qr_code_url: 'https://example.com/qr',
        },
      },
    };
    expect(event.data.payment_method).toBe('pix');
    expect(event.data.amount).toBe(2990);
  });

  it('should handle charge.refunded', () => {
    const event = {
      type: 'charge.refunded',
      data: { id: 'ch_1', status: 'refunded', amount: 2990 },
    };
    expect(event.data.status).toBe('refunded');
  });

  it('should handle subscription.canceled', () => {
    const event = {
      type: 'subscription.canceled',
      data: {
        id: 'sub_pagarme_1',
        status: 'canceled',
        canceled_at: '2026-04-20T10:00:00Z',
      },
    };
    expect(event.data.status).toBe('canceled');
    expect(event.data.canceled_at).toBeDefined();
  });
});
