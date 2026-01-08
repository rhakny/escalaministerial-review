import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Enums } from "@/integrations/supabase/types";

interface InvitationParams {
  email: string;
  full_name: string; // Não usado na EF, mas útil para o frontend
  church_id: string;
  role: Enums<'app_role'>;
}

interface InvitationResponse {
  message: string;
  token: string;
}

/**
 * Hook para criar um convite de administrador/líder via Edge Function.
 * Retorna o token para que o frontend possa gerar o link de compartilhamento.
 */
export const useCreateInvitation = () => {
  const queryClient = useQueryClient();
  
  return useMutation<InvitationResponse, Error, InvitationParams>({
    mutationFn: async (params) => {
      
      // 1. Força a renovação da sessão para garantir um token fresco
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        throw new Error("Falha ao renovar a sessão. Por favor, faça login novamente.");
      }
      
      const token = refreshData.session?.access_token;
      
      if (!token) {
        throw new Error("Sessão expirada ou ausente. Por favor, faça login novamente.");
      }

      const { data, error } = await supabase.functions.invoke('create-invitation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: params.email,
            church_id: params.church_id,
            role: params.role,
        }),
      });

      if (error) {
        const errorMessage = data?.message || error.message || "Falha ao criar o convite.";
        throw new Error(errorMessage);
      }

      if (!data || !data.token) {
        throw new Error("Resposta inválida da Edge Function.");
      }
      
      return data as InvitationResponse;
    },
    onSuccess: (_, variables) => {
      toast.success(`Convite criado com sucesso para ${variables.email}!`);
      
      // Invalida a lista de convites e administradores
      queryClient.invalidateQueries({ queryKey: ["churchAdmins", variables.church_id] });
      queryClient.invalidateQueries({ queryKey: ["invitations", variables.church_id] });
    },
    onError: (error) => {
      console.error("Invitation Creation Error:", error);
      toast.error(error.message || "Erro ao criar o convite.");
    },
  });
};
