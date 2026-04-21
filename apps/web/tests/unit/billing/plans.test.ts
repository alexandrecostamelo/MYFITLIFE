import { describe, it, expect } from 'vitest';

describe('Plan Configuration', () => {
  const PLANS = {
    free: { price: 0, ai_messages_day: 5, lab_uploads_day: 0 },
    pro_monthly: { price: 29.90, ai_messages_day: 30, lab_uploads_day: 5 },
    pro_yearly: { price: 249.90, ai_messages_day: 30, lab_uploads_day: 5 },
    premium_monthly: { price: 99.90, ai_messages_day: 100, lab_uploads_day: 20 },
    premium_yearly: { price: 999.90, ai_messages_day: 100, lab_uploads_day: 20 },
  };

  it('should have correct pricing', () => {
    expect(PLANS.pro_monthly.price).toBe(29.90);
    expect(PLANS.premium_monthly.price).toBe(99.90);
    expect(PLANS.pro_yearly.price).toBeLessThan(PLANS.pro_monthly.price * 12);
  });

  it('should enforce tier limits', () => {
    expect(PLANS.free.ai_messages_day).toBeLessThan(PLANS.pro_monthly.ai_messages_day);
    expect(PLANS.pro_monthly.ai_messages_day).toBeLessThan(PLANS.premium_monthly.ai_messages_day);
  });

  it('should not allow free users to upload labs', () => {
    expect(PLANS.free.lab_uploads_day).toBe(0);
  });

  it('yearly should save ~2 months', () => {
    const monthlyTotal = PLANS.pro_monthly.price * 12;
    const yearlyPrice = PLANS.pro_yearly.price;
    const savings = monthlyTotal - yearlyPrice;
    expect(savings).toBeGreaterThan(PLANS.pro_monthly.price * 1.5);
  });

  it('premium yearly should save vs monthly', () => {
    const monthlyTotal = PLANS.premium_monthly.price * 12;
    expect(PLANS.premium_yearly.price).toBeLessThan(monthlyTotal);
  });

  it('all tiers should have non-negative values', () => {
    for (const [, plan] of Object.entries(PLANS)) {
      expect(plan.price).toBeGreaterThanOrEqual(0);
      expect(plan.ai_messages_day).toBeGreaterThanOrEqual(0);
      expect(plan.lab_uploads_day).toBeGreaterThanOrEqual(0);
    }
  });
});
