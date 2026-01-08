import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type ResponseStatus = 'pending' | 'confirmed' | 'declined'; // Definido como string literal

interface SubmitResponseData {
  token: string;
  status: ResponseStatus;
  notes?: string;
}

/**
 * Hook para submeter a resposta de um membro a uma atribuição de escala usando o token.
 */
export const useSubmitScheduleResponse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ token, status, notes }: SubmitResponseData) => {
      
      // 1. Buscar a atribuição (assignment) usando o token
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('schedule_assignments')
        .select('id, schedule_id, member_id')
        .eq('response_token', token)
        .single();

      if (assignmentError || !assignmentData) {
        throw new Error("Token de atribuição inválido ou expirado.");
      }
      
      const assignmentId = assignmentData.id;

      // 2. Verificar se já existe uma resposta para esta atribuição
      const { data: existingResponse, error: fetchResponseError } = await supabase
        .from('schedule_responses')
        .select('id')
        .eq('schedule_assignment_id', assignmentId)
        .single();

      if (fetchResponseError && fetchResponseError.code !== 'PGRST116') { // PGRST116 = No rows found
        throw fetchResponseError;
      }
      
      const baseData = {
        response_status: status, // Agora é uma string simples
        response_date: new Date().toISOString(),
        notes: notes || null,
      };

      if (existingResponse) {
        // 3. Se existir, atualiza a resposta
        const updateData: TablesUpdate<'schedule_responses'> = baseData;
        
        const { error: updateError } = await supabase
          .from('schedule_responses')
          .update(updateData)
          .eq('id', existingResponse.id);
        
        if (updateError) throw updateError;
      } else {
        // 4. Se não existir, insere a nova resposta
        const insertData: TablesInsert<'schedule_responses'> = {
          ...baseData,
          schedule_assignment_id: assignmentId,
        };
        
        const { error: insertError } = await supabase
          .from('schedule_responses')
          .insert(insertData);
        
        if (insertError) throw insertError;
      }
      
      // Retornamos o token para que o onSuccess possa invalidar a query correta
      return { assignmentId, status, token }; 
    },
    onSuccess: async (_, variables) => {
      const action = variables.status === 'confirmed' ? "Confirmada" : "Recusada";
      toast.success(`Sua presença foi ${action} com sucesso!`);
      
      // Invalida e força o refetch da query de detalhes da atribuição
      queryClient.invalidateQueries({ queryKey: ["assignmentDetails", variables.token] });
      await queryClient.refetchQueries({ queryKey: ["assignmentDetails", variables.token] });
    },
    onError: (error) => {
      console.error("Response Submission Error:", error);
      toast.error(error.message || "Erro ao registrar sua resposta.");
    },
  });
};
