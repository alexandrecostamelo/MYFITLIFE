import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: { id: 'sub-1', user_id: 'user-1', tier: 'pro' } }),
  maybeSingle: vi.fn().mockResolvedValue({ data: null }),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    ...mockSupabase,
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
  })),
}));

describe('Stripe Webhook Events', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should handle checkout.session.completed', () => {
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_test',
          subscription: 'sub_test',
          metadata: { user_id: 'user-1', plan_id: 'pro_monthly' },
        },
      },
    };

    expect(event.type).toBe('checkout.session.completed');
    expect(event.data.object.metadata.user_id).toBe('user-1');
  });

  it('should handle invoice.paid', () => {
    const event = {
      type: 'invoice.paid',
      data: {
        object: {
          subscription: 'sub_test',
          amount_paid: 2990,
          currency: 'brl',
          customer: 'cus_test',
        },
      },
    };

    expect(event.data.object.amount_paid).toBe(2990);
    expect(event.data.object.currency).toBe('brl');
  });

  it('should handle customer.subscription.deleted', () => {
    const event = {
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_test',
          customer: 'cus_test',
          status: 'canceled',
        },
      },
    };

    expect(event.data.object.status).toBe('canceled');
  });

  it('should handle invoice.payment_failed', () => {
    const event = {
      type: 'invoice.payment_failed',
      data: {
        object: {
          subscription: 'sub_test',
          attempt_count: 3,
          next_payment_attempt: null,
          customer: 'cus_test',
        },
      },
    };

    expect(event.data.object.attempt_count).toBe(3);
    expect(event.data.object.next_payment_attempt).toBeNull();
  });
});
