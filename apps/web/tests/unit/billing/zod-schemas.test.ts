import { describe, it, expect } from 'vitest';
import {
  stripeCheckoutSchema,
  pagarmeSubscribeSchema,
  cancelReasonSchema,
  acceptOfferSchema,
  changePlanSchema,
  pixPaymentSchema,
} from '@/lib/billing/schemas';

describe('Billing Zod Schemas', () => {
  describe('stripeCheckoutSchema', () => {
    it('should accept valid checkout', () => {
      expect(stripeCheckoutSchema.safeParse({ cycle: 'monthly' }).success).toBe(true);
      expect(stripeCheckoutSchema.safeParse({ cycle: 'yearly' }).success).toBe(true);
    });

    it('should reject invalid cycle', () => {
      expect(stripeCheckoutSchema.safeParse({ cycle: 'weekly' }).success).toBe(false);
      expect(stripeCheckoutSchema.safeParse({}).success).toBe(false);
    });
  });

  describe('pagarmeSubscribeSchema', () => {
    it('should accept valid subscribe with credit_card', () => {
      const valid = pagarmeSubscribeSchema.safeParse({
        plan: 'pro_monthly',
        method: 'credit_card',
        card_token: 'tok_xxx',
        customer: { name: 'João Silva', document: '12345678901' },
      });
      expect(valid.success).toBe(true);
    });

    it('should accept boleto without card_token', () => {
      const valid = pagarmeSubscribeSchema.safeParse({
        plan: 'pro_monthly',
        method: 'boleto',
        customer: { name: 'Maria', document: '12345678901' },
      });
      expect(valid.success).toBe(true);
    });

    it('should reject invalid payment method', () => {
      const invalid = pagarmeSubscribeSchema.safeParse({
        plan: 'pro_monthly',
        method: 'bitcoin',
        customer: { name: 'Test', document: '12345678901' },
      });
      expect(invalid.success).toBe(false);
    });

    it('should reject missing customer name', () => {
      const invalid = pagarmeSubscribeSchema.safeParse({
        plan: 'pro_monthly',
        method: 'boleto',
        customer: { name: '', document: '12345678901' },
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('pixPaymentSchema', () => {
    it('should accept valid pix', () => {
      const valid = pixPaymentSchema.safeParse({ cycle: 'monthly', document: '12345678901' });
      expect(valid.success).toBe(true);
    });

    it('should reject invalid document', () => {
      expect(pixPaymentSchema.safeParse({ cycle: 'monthly', document: '123' }).success).toBe(false);
      expect(pixPaymentSchema.safeParse({ cycle: 'monthly', document: 'abc' }).success).toBe(false);
    });
  });

  describe('cancelReasonSchema', () => {
    it('should accept valid reason', () => {
      const valid = cancelReasonSchema.safeParse({
        attempt_id: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'too_expensive',
      });
      expect(valid.success).toBe(true);
    });

    it('should accept reason with details', () => {
      const valid = cancelReasonSchema.safeParse({
        attempt_id: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'other',
        details: 'Não uso mais',
      });
      expect(valid.success).toBe(true);
    });

    it('should accept all valid reasons', () => {
      const reasons = ['too_expensive', 'not_using', 'technical_issues', 'changed_goals', 'missing_feature', 'switching', 'other'];
      for (const reason of reasons) {
        const result = cancelReasonSchema.safeParse({
          attempt_id: '550e8400-e29b-41d4-a716-446655440000',
          reason,
        });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid reason', () => {
      const invalid = cancelReasonSchema.safeParse({
        attempt_id: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'invalid_reason',
      });
      expect(invalid.success).toBe(false);
    });

    it('should reject missing attempt_id', () => {
      expect(cancelReasonSchema.safeParse({ reason: 'too_expensive' }).success).toBe(false);
    });
  });

  describe('acceptOfferSchema', () => {
    it('should accept valid offer', () => {
      const valid = acceptOfferSchema.safeParse({
        attempt_id: '550e8400-e29b-41d4-a716-446655440000',
        offer_type: 'pause_30d',
      });
      expect(valid.success).toBe(true);
    });

    it('should reject invalid offer_type', () => {
      const invalid = acceptOfferSchema.safeParse({
        attempt_id: '550e8400-e29b-41d4-a716-446655440000',
        offer_type: 'free_forever',
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('changePlanSchema', () => {
    it('should accept valid plan change', () => {
      const valid = changePlanSchema.safeParse({ to_tier: 'premium', to_cycle: 'yearly' });
      expect(valid.success).toBe(true);
    });

    it('should reject empty tier', () => {
      expect(changePlanSchema.safeParse({ to_tier: '', to_cycle: 'monthly' }).success).toBe(false);
    });

    it('should reject invalid cycle', () => {
      expect(changePlanSchema.safeParse({ to_tier: 'pro', to_cycle: 'weekly' }).success).toBe(false);
    });
  });
});
