import { z } from 'zod';

export const stripeCheckoutSchema = z.object({
  cycle: z.enum(['monthly', 'yearly']),
});

export const pagarmeSubscribeSchema = z.object({
  plan: z.string().min(1),
  method: z.enum(['credit_card', 'boleto']),
  card_token: z.string().optional(),
  customer: z.object({
    name: z.string().min(2),
    document: z.string().min(11).max(14),
    document_type: z.enum(['CPF', 'CNPJ']).optional(),
    phone: z.unknown().optional(),
  }),
  billing_address: z.record(z.unknown()).optional(),
});

export const pixPaymentSchema = z.object({
  cycle: z.enum(['monthly', 'yearly']),
  document: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos numéricos'),
});

export const cancelReasonSchema = z.object({
  attempt_id: z.string().uuid(),
  reason: z.enum([
    'too_expensive',
    'not_using',
    'technical_issues',
    'changed_goals',
    'missing_feature',
    'switching',
    'other',
  ]),
  details: z.string().max(1000).optional(),
});

export const acceptOfferSchema = z.object({
  attempt_id: z.string().uuid(),
  offer_type: z.enum([
    'pause_30d',
    'pause_60d',
    'pause_90d',
    'discount_50_2mo',
    'downgrade_pro',
    'downgrade_monthly',
    'premium_trial',
    'switch_professional',
  ]),
});

export const changePlanSchema = z.object({
  to_tier: z.string().min(1),
  to_cycle: z.enum(['monthly', 'yearly']),
});
