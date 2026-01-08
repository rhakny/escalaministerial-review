import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export const useUpdateChurch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: TablesUpdate<'churches'> }) => {
      const { data, error } = await supabase
        .from('churches')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (updatedChurch) => {
      toast.success(`Igreja "${updatedChurch.name}" atualizada com sucesso!`);
      // Invalida o cache para que useChurch recarregue os dados
      queryClient.invalidateQueries({ queryKey: ["administeredChurches"] });
    },
    onError: (error) => {
      console.error("Church Update Error:", error);
      toast.error("Erro ao atualizar as informações da igreja.");
    },
  });
};

export const useDeleteChurch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (churchId: string) => {
      const { error } = await supabase
        .from('churches')
        .delete()
        .eq('id', churchId);

      if (error) {
        // Tentativa de fornecer feedback mais útil sobre a causa da falha
        if (error.code === '42501') {
          throw new Error("Permissão negada (RLS). Verifique se você é o proprietário da igreja.");
        }
        if (error.message.includes('violates foreign key constraint')) {
          throw new Error("A exclusão falhou. Certifique-se de que todas as dependências (membros, ministérios, escalas) foram removidas ou que a exclusão em cascata está configurada no banco de dados.");
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Igreja excluída com sucesso! Todos os dados associados foram removidos.");
      // Invalida o cache para forçar a reavaliação da igreja selecionada
      queryClient.invalidateQueries({ queryKey: ["administeredChurches"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
    onError: (error) => {
      console.error("Church Deletion Error:", error);
      toast.error(error.message || "Erro ao excluir a igreja.");
    },
  });
};
