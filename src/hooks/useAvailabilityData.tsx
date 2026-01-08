import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Availability = Tables<'member_availability'>;

// Busca a disponibilidade de um membro específico
export const useMemberAvailability = (memberId: string | null) => {
  return useQuery<Availability[]>({
    queryKey: ["memberAvailability", memberId],
    queryFn: async () => {
      if (!memberId) return [];
      
      const { data, error } = await supabase
        .from('member_availability')
        .select('*')
        .eq('member_id', memberId)
        .eq('available', false) // Focando em datas de indisponibilidade
        .order('date', { ascending: true });

      if (error) {
        console.error("Error fetching member availability:", error);
        throw new Error("Não foi possível carregar a disponibilidade do membro.");
      }
      return data;
    },
    enabled: !!memberId,
  });
};

// Mutação para adicionar/remover indisponibilidade
export const useToggleMemberAvailability = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ memberId, date, isAvailable }: { memberId: string, date: string, isAvailable: boolean }) => {
      // 1. Check if entry exists
      const { data: existing, error: fetchError } = await supabase
        .from('member_availability')
        .select('id')
        .eq('member_id', memberId)
        .eq('date', date)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = No rows found
        throw fetchError;
      }

      if (existing) {
        // If entry exists, update or delete it
        if (isAvailable) {
          // If setting to available (true), delete the unavailability entry
          const { error: deleteError } = await supabase
            .from('member_availability')
            .delete()
            .eq('id', existing.id);
          if (deleteError) throw deleteError;
        } else {
          // If setting to unavailable (false), update the existing entry (should already be false, but for safety)
          const { error: updateError } = await supabase
            .from('member_availability')
            .update({ available: false })
            .eq('id', existing.id);
          if (updateError) throw updateError;
        }
      } else if (!isAvailable) {
        // If entry does not exist and we are setting to unavailable (false), insert new entry
        const insertData: TablesInsert<'member_availability'> = {
          member_id: memberId,
          date: date,
          available: false,
          notes: null,
        };
        const { error: insertError } = await supabase
          .from('member_availability')
          .insert(insertData);
        if (insertError) throw insertError;
      }
      // If entry doesn't exist and isAvailable is true, do nothing (default is available)
    },
    onSuccess: (_, variables) => {
      const action = variables.isAvailable ? "removida" : "adicionada";
      toast.success(`Disponibilidade ${action} com sucesso.`);
      queryClient.invalidateQueries({ queryKey: ["memberAvailability", variables.memberId] });
    },
    onError: (error) => {
      console.error("Availability Error:", error);
      toast.error("Erro ao atualizar disponibilidade.");
    },
  });
};
