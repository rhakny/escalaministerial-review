import { useChurch } from "./useChurch";
import { usePlans, Plan } from "./usePlans";
import { useMembers } from "./useMemberData";

export const useMemberLimits = (churchId: string | null) => {
  const { church, isLoading: isLoadingChurch } = useChurch();
  const { data: plans, isLoading: isLoadingPlans } = usePlans();
  const { data: members, isLoading: isLoadingMembers } = useMembers(churchId);
  
  // Encontra o plano atual (fallback para um plano 'free' padrão se a lista não carregou)
  const defaultFreePlan: Plan = { 
    id: 'free', 
    name: 'Teste Gratuito', 
    description: '15 dias de funções ilimitadas.', 
    churchLimit: 1, 
    memberLimit: 9999, // Limite alto para o trial
    prices: {
        monthly: { amount: 0, display: 'R$ 0,00' },
        quarterly: { amount: 0, display: 'R$ 0,00' },
        annual: { amount: 0, display: 'R$ 0,00' },
    }
  };
  
  const currentPlanId = church?.subscription_plan || 'free';
  const currentPlan = plans?.find(p => p.id === currentPlanId) || defaultFreePlan;
  
  const memberLimit = currentPlan.memberLimit;
  const currentMemberCount = members?.length || 0;
  const canAddMember = currentMemberCount < memberLimit;

  return {
    isLoading: isLoadingChurch || isLoadingPlans || isLoadingMembers,
    memberLimit,
    currentMemberCount,
    canAddMember,
    currentPlanName: currentPlan.name,
  };
};
