import { useChurch } from "./useChurch";
import { usePlans, Plan } from "./usePlans"; // Importando usePlans

export const useChurchLimits = () => {
  const { church, isLoading: isLoadingChurch } = useChurch();
  const { data: plans, isLoading: isLoadingPlans } = usePlans();
  
  // Encontra o plano atual (fallback para um plano 'free' padrão se a lista não carregou)
  const defaultFreePlan: Plan = { 
    id: 'free', 
    name: 'Teste Gratuito', 
    description: '15 dias de funções ilimitadas.', 
    churchLimit: 1, 
    memberLimit: 9999,
    prices: {
        monthly: { amount: 0, display: 'R$ 0,00' },
        quarterly: { amount: 0, display: 'R$ 0,00' },
        annual: { amount: 0, display: 'R$ 0,00' },
    }
  };
  const currentPlanId = church?.subscription_plan || 'free';
  const currentPlan = plans?.find(p => p.id === currentPlanId) || defaultFreePlan;
  
  // No modelo de igreja única, o limite de igrejas é sempre 1.
  const churchLimit = 1;
  const currentChurchCount = church ? 1 : 0;
  const canAddChurch = currentChurchCount < churchLimit; // Sempre true se não houver igreja

  return {
    isLoading: isLoadingChurch || isLoadingPlans,
    churchLimit,
    currentChurchCount,
    canAddChurch,
    currentPlanName: currentPlan.name,
  };
};
