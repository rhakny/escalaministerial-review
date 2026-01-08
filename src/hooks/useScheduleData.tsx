import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { format } from "date-fns";

// Define a type that includes the joined ministry name
export type ScheduleWithMinistry = Tables<'schedules'> & {
  ministries: { name: string } | null;
};

// Hook para buscar as 5 próximas escalas (usado no Dashboard)
export const useSchedules = (churchId: string | null) => {
  return useQuery<ScheduleWithMinistry[]>({
    queryKey: ["schedules", churchId],
    queryFn: async () => {
      if (!churchId) return [];
      
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('schedules')
        .select('*, ministries(name)')
        .eq('church_id', churchId)
        .gte('event_date', today) // Only future schedules
        .order('event_date', { ascending: true })
        .limit(5); // Limit for dashboard display

      if (error) {
        console.error("Error fetching schedules:", error);
        throw new Error("Não foi possível carregar as escalas.");
      }
      return data as ScheduleWithMinistry[];
    },
    enabled: !!churchId,
  });
};

// Hook para buscar TODAS as escalas futuras (usado na página de Escalas)
export const useAllFutureSchedules = (churchId: string | null) => {
  return useQuery<ScheduleWithMinistry[]>({
    queryKey: ["allFutureSchedules", churchId],
    queryFn: async () => {
      if (!churchId) return [];
      
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('schedules')
        .select('*, ministries(name)')
        .eq('church_id', churchId)
        .gte('event_date', today) // Only future schedules
        .order('event_date', { ascending: true });

      if (error) {
        console.error("Error fetching all future schedules:", error);
        throw new Error("Não foi possível carregar todas as escalas futuras.");
      }
      return data as ScheduleWithMinistry[];
    },
    enabled: !!churchId,
  });
};

// Novo Hook para buscar as atribuições de membros
export const useScheduleAssignments = (scheduleId: string | null) => {
  return useQuery<Tables<'schedule_assignments'>[]>({
    queryKey: ["scheduleAssignments", scheduleId],
    queryFn: async () => {
      if (!scheduleId) return [];

      const { data, error } = await supabase
        .from('schedule_assignments')
        .select('*')
        .eq('schedule_id', scheduleId);

      if (error) {
        console.error("Error fetching schedule assignments:", error);
        throw new Error("Não foi possível carregar os membros escalados.");
      }
      return data;
    },
    enabled: !!scheduleId,
    staleTime: 1000 * 60, // 1 minute
  });
};


export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (scheduleData: TablesInsert<'schedules'>) => {
      const { data, error } = await supabase
        .from('schedules')
        .insert(scheduleData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Note: We don't toast here, let the calling component handle success message after full process (including member assignment)
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["allFutureSchedules"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
    onError: (error) => {
      console.error("Creation Error:", error);
      toast.error("Erro ao criar escala.");
    },
  });
};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: TablesUpdate<'schedules'> }) => {
      const { data, error } = await supabase
        .from('schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (updatedSchedule) => {
      toast.success(`Escala de ${updatedSchedule.event_date} atualizada com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["allFutureSchedules"] });
    },
    onError: (error) => {
      console.error("Update Error:", error);
      toast.error("Erro ao atualizar escala.");
    },
  });
};

export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleId: string) => {
      // RLS deve garantir que as atribuições sejam excluídas em cascata,
      // mas se não, o Supabase pode exigir exclusão manual ou configuração de RLS.
      // Assumindo que a exclusão em cascata está configurada no banco de dados.
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Escala excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["allFutureSchedules"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
    onError: (error) => {
      console.error("Deletion Error:", error);
      toast.error("Erro ao excluir escala.");
    },
  });
};

// Este hook agora é apenas para invalidação de cache, pois a lógica de inserção/deleção
// foi movida para os componentes NovaEscala e Escalas para lidar com tokens.
export const useAssignMembersToSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ scheduleId, memberIds }: { scheduleId: string, memberIds: string[] }) => {
      // A lógica de DB foi movida para os componentes. Este hook apenas simula a ação.
      // Retornamos um sucesso simulado para permitir a invalidação.
      return { scheduleId, memberIds };
    },
    onSuccess: () => {
      // Esta função é chamada manualmente nos componentes após a inserção bem-sucedida
      // para garantir que o cache seja invalidado.
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["allFutureSchedules"] });
      queryClient.invalidateQueries({ queryKey: ["scheduleAssignments"] }); // Invalidate assignments cache
    },
    onError: (error) => {
      console.error("Assignment Error:", error);
      toast.error("Erro ao atribuir membros à escala.");
    },
  });
};
