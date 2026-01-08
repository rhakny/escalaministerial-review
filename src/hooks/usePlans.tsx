import { useQuery } from "@tanstack/react-query";

export interface PriceDetail {
  amount: number;
  display: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  churchLimit: number;
  memberLimit: number;
  prices: {
    monthly: PriceDetail;
    quarterly: PriceDetail;
    semiannual: PriceDetail;
    annual: PriceDetail;
  };
  features: string[];
}

// Definição estática dos planos
const PLANS_DATA: Plan[] = [
  {
    id: 'free',
    name: 'Teste Gratuito',
    description: '15 dias para testar a organização.',
    churchLimit: 1,
    memberLimit: 30,
    prices: {
      monthly: { amount: 0, display: 'R$ 0,00' },
      quarterly: { amount: 0, display: 'R$ 0,00' },
      semiannual: { amount: 0, display: 'R$ 0,00' },
      annual: { amount: 0, display: 'R$ 0,00' },
    },
    features: ['15 dias de teste', 'Até 30 membros', 'Escalas Ilimitadas', 'Sem automação WhatsApp']
  },
  {
    id: 'semente',
    name: 'Semente',
    description: 'Para igrejas que estão começando a organização.',
    churchLimit: 1,
    memberLimit: 30,
    prices: {
      monthly: { amount: 29, display: 'R$ 29,00' },
      quarterly: { amount: 78.30, display: 'R$ 78,30' },
      semiannual: { amount: 147.90, display: 'R$ 147,90' },
      annual: { amount: 278.40, display: 'R$ 278,40' },
    },
    features: ['Até 30 membros', 'Escalas Ilimitadas', 'Painel do Voluntário', 'Sem automação WhatsApp']
  },
  {
    id: 'crescimento',
    name: 'Crescimento',
    description: 'O poder da automação para sua igreja.',
    churchLimit: 1,
    memberLimit: 80,
    prices: {
      monthly: { amount: 89, display: 'R$ 89,00' },
      quarterly: { amount: 240.30, display: 'R$ 240,30' },
      semiannual: { amount: 453.90, display: 'R$ 453,90' },
      annual: { amount: 854.40, display: 'R$ 854,40' },
    },
    features: ['Até 80 membros', 'Automação WhatsApp (n8n)', 'Confirmação auto. 48h antes', 'Escalas Ilimitadas']
  },
  {
    id: 'reino',
    name: 'Reino',
    description: 'Gestão total e suporte VIP.',
    churchLimit: 1,
    memberLimit: 99999,
    prices: {
      monthly: { amount: 149, display: 'R$ 149,00' },
      quarterly: { amount: 402.30, display: 'R$ 402,30' },
      semiannual: { amount: 759.90, display: 'R$ 759,90' },
      annual: { amount: 1430.40, display: 'R$ 1430,40' },
    },
    features: ['Membros Ilimitados', 'Tudo do Crescimento', 'Suporte Prioritário (WhatsApp)']
  },
];

/**
 * Hook para buscar os planos e preços de forma estática.
 */
export const usePlans = () => {
  return useQuery<Plan[]>({
    queryKey: ["subscriptionPlans"],
    queryFn: async () => {
      // Simula um pequeno delay para consistência
      await new Promise(resolve => setTimeout(resolve, 100));
      return PLANS_DATA;
    },
    staleTime: Infinity, // Nunca precisa recarregar
  });
};
