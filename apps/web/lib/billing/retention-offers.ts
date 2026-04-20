export type CancelReason =
  | 'too_expensive'
  | 'not_using'
  | 'technical_issues'
  | 'changed_goals'
  | 'missing_feature'
  | 'switching'
  | 'other';

export type OfferType =
  | 'discount_50_2mo'
  | 'pause_30d'
  | 'pause_60d'
  | 'pause_90d'
  | 'downgrade_pro'
  | 'downgrade_monthly'
  | 'premium_trial'
  | 'switch_professional'
  | 'none';

export interface Offer {
  type: OfferType;
  title: string;
  description: string;
  cta: string;
}

export function pickOffer(params: {
  reason: CancelReason;
  current_tier: string;
  current_cycle: string;
  has_premium_assignment?: boolean;
}): Offer[] {
  const offers: Offer[] = [];

  if (params.reason === 'too_expensive') {
    if (params.current_tier === 'premium') {
      offers.push({
        type: 'downgrade_pro',
        title: 'Que tal trocar pro plano Pro?',
        description:
          'Mantenha autopilot + coach ilimitado por R$ 29,90/mês. Sem consultoria humana, mas tudo de IA.',
        cta: 'Trocar pra Pro',
      });
    }
    if (params.current_cycle === 'yearly' && params.current_tier === 'pro') {
      offers.push({
        type: 'downgrade_monthly',
        title: 'Prefere pagar mensal?',
        description: 'Troque pra Pro Mensal R$ 29,90. Menos comprometimento.',
        cta: 'Trocar pra mensal',
      });
    }
    offers.push({
      type: 'discount_50_2mo',
      title: '50% off nos próximos 2 meses',
      description: 'Oferta única. Pague metade por 60 dias pra continuar aproveitando.',
      cta: 'Aceitar desconto',
    });
  }

  if (params.reason === 'not_using') {
    offers.push({
      type: 'pause_60d',
      title: 'Pausa de 60 dias',
      description: 'Sua assinatura fica em standby. Não cobramos, mas volta direto onde parou.',
      cta: 'Pausar por 60 dias',
    });
    offers.push({
      type: 'pause_30d',
      title: 'Pausa de 30 dias',
      description: 'Tira 1 mês de respiro. Pagamentos pausados.',
      cta: 'Pausar por 30 dias',
    });
  }

  if (params.reason === 'technical_issues') {
    offers.push({
      type: 'pause_30d',
      title: 'Pausa enquanto resolvemos',
      description:
        'Conta pausada gratuitamente por 30 dias. Enquanto isso, nossa equipe entra em contato.',
      cta: 'Pausar e falar com suporte',
    });
  }

  if (params.reason === 'changed_goals') {
    if (params.current_tier === 'pro' && !params.has_premium_assignment) {
      offers.push({
        type: 'premium_trial',
        title: 'Experimente o Premium por 14 dias grátis',
        description:
          'Consultoria humana com nutri + personal. Seus objetivos mudaram? Profissional ajuda a ajustar.',
        cta: 'Testar Premium grátis',
      });
    }
    if (params.current_tier === 'premium' && params.has_premium_assignment) {
      offers.push({
        type: 'switch_professional',
        title: 'Trocar de profissional',
        description:
          'Talvez seu nutri/personal atual não combinou. Temos outros disponíveis no pool.',
        cta: 'Ver outros profissionais',
      });
    }
  }

  if (params.reason === 'missing_feature') {
    offers.push({
      type: 'pause_30d',
      title: 'Pausa enquanto você avalia',
      description: 'Pausamos sem cobrar. Se lançarmos a feature que você precisa, avisamos.',
      cta: 'Pausar por 30 dias',
    });
  }

  if (params.reason === 'switching' || params.reason === 'other') {
    offers.push({
      type: 'discount_50_2mo',
      title: '50% off pra pensar melhor',
      description: 'Que tal 2 meses com metade do preço antes de decidir?',
      cta: 'Aceitar desconto',
    });
    offers.push({
      type: 'pause_30d',
      title: 'Pausar por 30 dias',
      description: 'Tempo pra avaliar sem cobranças.',
      cta: 'Pausar por 30 dias',
    });
  }

  if (offers.length === 0) {
    offers.push({
      type: 'pause_30d',
      title: 'Pausar em vez de cancelar',
      description: 'Fica 30 dias sem cobrança. Se não voltar, cancelamos automaticamente.',
      cta: 'Pausar por 30 dias',
    });
  }

  return offers.slice(0, 2);
}

export const REASON_LABELS: Record<CancelReason, string> = {
  too_expensive: 'Está caro demais',
  not_using: 'Não estou usando o suficiente',
  technical_issues: 'Problemas técnicos',
  changed_goals: 'Meus objetivos mudaram',
  missing_feature: 'Falta uma funcionalidade',
  switching: 'Vou usar outro app',
  other: 'Outro motivo',
};
