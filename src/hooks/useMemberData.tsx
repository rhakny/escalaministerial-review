import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

// Define a type that includes the joined ministry name for display purposes
export type MemberWithMinistry = Tables<'members'> & {
  ministries: { name: string } | null;
};

export const useMembers = (churchId: string | null) => {
  return useQuery<MemberWithMinistry[]>({
    queryKey: ["members", churchId],
    queryFn: async () => {
      if (!churchId) return [];
      
      const { data, error } = await supabase
        .from('members')
        .select('*, ministries(name)') 
        .eq('church_id', churchId)
        .order('name', { ascending: true });

      if (error) {
        console.error("Error fetching members:", error);
        throw new Error("Não foi possível carregar os membros.");
      }
      return data as MemberWithMinistry[]; 
    },
    enabled: !!churchId,
  });
};

// Definindo um tipo de dados de entrada que não exige o email, mas o DB exige.
// O email será preenchido com um placeholder no mutationFn.
type MemberInsertData = Omit<TablesInsert<'members'>, 'email'> & { email?: string };

export const useCreateMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (memberData: MemberInsertData) => {
      const dataToInsert: TablesInsert<'members'> = {
        ...memberData,
        email: memberData.email || "placeholder@escalaministerial.com.br", // Usar placeholder se não fornecido
      } as TablesInsert<'members'>;

      const { data, error } = await supabase
        .from('members')
        .insert(dataToInsert)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newMember) => {
      toast.success(`Membro "${newMember.name}" cadastrado com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["ministries"] }); // To update member count in ministry list
    },
    onError: (error) => {
      console.error("Creation Error:", error);
      toast.error("Erro ao cadastrar membro.");
    },
  });
};

export const useUpdateMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: TablesUpdate<'members'> }) => {
      const { data, error } = await supabase
        .from('members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (updatedMember) => {
      toast.success(`Membro "${updatedMember.name}" atualizado com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
    onError: (error) => {
      console.error("Update Error:", error);
      toast.error("Erro ao atualizar membro.");
    },
  });
};

export const useDeleteMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      // RLS deve garantir que a disponibilidade e atribuições sejam excluídas em cascata.
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Membro excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["ministries"] }); // To update member count in ministry list
    },
    onError: (error) => {
      console.error("Deletion Error:", error);
      toast.error("Erro ao excluir membro.");
    },
  });
};
