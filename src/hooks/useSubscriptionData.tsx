import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface CancelSubscriptionParams {
  churchId: string;
}

/**
 * Hook para cancelar a assinatura de uma igreja.
 * Define o plano como 'free', mas mantém a data de expiração para permitir
 * o uso até o final do período pago.
 */
export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ churchId }: CancelSubscriptionParams) => {
      // 1. Busca o plano atual e a data de expiração
      const { data: churchData, error: fetchError } = await supabase
        .from('churches')
        .select('subscription_plan, subscription_end_date')
        .eq('id', churchId)
        .single();

      if (fetchError || !churchData) {
        throw new Error("Igreja não encontrada ou erro ao buscar dados.");
      }
      
      if (churchData.subscription_plan === 'free') {
        throw new Error("O plano já é gratuito.");
      }

      // 2. Atualiza o plano para 'free'. A data de expiração é mantida
      // e será usada pelo useChurch para determinar o bloqueio.
      const { data: updatedChurch, error: updateError } = await supabase
        .from('churches')
        .update({ 
          subscription_plan: 'free',
          // subscription_end_date é mantido
        })
        .eq('id', churchId)
        .select()
        .single();

      if (updateError) throw updateError;
      
      return updatedChurch;
    },
    onSuccess: (updatedChurch) => {
      const expirationDate = updatedChurch.subscription_end_date 
        ? format(new Date(updatedChurch.subscription_end_date), 'dd/MM/yyyy') 
        : 'a data de expiração';
        
      toast.success(`Assinatura cancelada. O acesso pago será mantido até ${expirationDate}.`);
      // Invalida o cache para que useChurch recarregue os dados
      queryClient.invalidateQueries({ queryKey: ["churchDetails", updatedChurch.id] });
    },
    onError: (error) => {
      console.error("Cancellation Error:", error);
      toast.error(error.message || "Erro ao cancelar a assinatura.");
    },
  });
};
