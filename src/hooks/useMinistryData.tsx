import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Ministry = Tables<'ministries'>;

export const useMinistries = (churchId: string | null) => {
  return useQuery<Ministry[]>({
    queryKey: ["ministries", churchId],
    queryFn: async () => {
      if (!churchId) return [];
      
      const { data, error } = await supabase
        .from('ministries')
        .select('*')
        .eq('church_id', churchId)
        .order('name', { ascending: true });

      if (error) {
        console.error("Error fetching ministries:", error);
        throw new Error("Não foi possível carregar os ministérios.");
      }
      return data;
    },
    enabled: !!churchId,
  });
};

export const useCreateMinistry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ministryData: TablesInsert<'ministries'>) => {
      const { data, error } = await supabase
        .from('ministries')
        .insert(ministryData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newMinistry) => {
      toast.success(`Ministério "${newMinistry.name}" cadastrado com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["ministries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
    onError: (error) => {
      console.error("Creation Error:", error);
      toast.error("Erro ao cadastrar ministério.");
    },
  });
};

export const useUpdateMinistry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: TablesUpdate<'ministries'> }) => {
      const { data, error } = await supabase
        .from('ministries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (updatedMinistry) => {
      toast.success(`Ministério "${updatedMinistry.name}" atualizado com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["ministries"] });
    },
    onError: (error) => {
      console.error("Update Error:", error);
      toast.error("Erro ao atualizar ministério.");
    },
  });
};

export const useDeleteMinistry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ministryId: string) => {
      // RLS deve garantir que membros e escalas sejam excluídos em cascata.
      const { error } = await supabase
        .from('ministries')
        .delete()
        .eq('id', ministryId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ministério excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["ministries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["members"] }); // Invalida membros, pois eles podem ter sido excluídos em cascata
    },
    onError: (error) => {
      console.error("Deletion Error:", error);
      toast.error("Erro ao excluir ministério. Verifique se há membros ou escalas associadas.");
    },
  });
};
