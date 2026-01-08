import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConfirmationParams {
  assignmentId: string;
  status: 'confirmed' | 'declined';
}

/**
 * Hook para confirmar ou recusar presença em uma escala pública.
 * Usa a função RPC do Supabase para contornar problemas de RLS.
 */
export const usePublicConfirmation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId, status }: ConfirmationParams) => {
      console.log('🚀 Iniciando confirmação:', { assignmentId, status });

      // Chama uma função RPC no Supabase que irá lidar com a lógica de upsert
      const { data, error } = await supabase.rpc('confirm_schedule_response', {
        p_assignment_id: assignmentId,
        p_status: status
      });

      if (error) {
        console.error("❌ Erro ao confirmar resposta:", error);
        throw new Error(error.message || "Falha ao processar a confirmação.");
      }

      console.log('✅ Resposta confirmada:', data);
      return { assignmentId, status, scheduleId: data };
    },
    onSuccess: async (data) => {
      console.log('✅ Sucesso! Invalidando cache para scheduleId:', data.scheduleId);
      
      // Invalida e aguarda o refetch
      await queryClient.invalidateQueries({ 
        queryKey: ["publicSchedule", data.scheduleId],
        refetchType: 'active'
      });

      console.log('🔄 Cache invalidado e refetch disparado');

      // Mensagem de sucesso
      const message = data.status === 'confirmed' 
        ? '✅ Presença confirmada com sucesso!' 
        : '❌ Presença recusada.';
      
      toast.success(message);
    },
    onError: (error) => {
      console.error("❌ Erro na mutação:", error);
      toast.error("Erro ao processar sua resposta. Tente novamente.");
    }
  });
};
