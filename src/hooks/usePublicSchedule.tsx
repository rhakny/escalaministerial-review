import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Schedule = Tables<'schedules'>;
type Ministry = Tables<'ministries'>;
type Member = Tables<'members'>;
type Assignment = Tables<'schedule_assignments'>;
type ScheduleResponse = Tables<'schedule_responses'>;

interface PublicScheduleData extends Schedule {
  ministries: Pick<Ministry, 'name'> | null;
  assignments: (Assignment & { 
    members: Pick<Member, 'name' | 'function'> | null;
    schedule_responses: ScheduleResponse[];
  })[];
}

/**
 * Hook para buscar uma escala e seus membros para visualização pública.
 * @param scheduleId O ID da escala a ser buscada.
 */
export const usePublicSchedule = (scheduleId: string | null) => {
  return useQuery<PublicScheduleData | null>({
    queryKey: ["publicSchedule", scheduleId],
    queryFn: async () => {
      if (!scheduleId) return null;

      console.log('🔍 Buscando escala:', scheduleId);

      // MUDANÇA CRÍTICA: Busca schedule_responses separadamente e depois junta
      // Isso evita problemas de cache do PostgREST com JOINs aninhados
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedules')
        .select(`
          *,
          ministries(name),
          assignments:schedule_assignments (
            id,
            member_id,
            schedule_id,
            created_at,
            response_token,
            members(name, function)
          )
        `)
        .eq('id', scheduleId)
        .single();

      if (scheduleError) {
        console.error("❌ Error fetching schedule:", scheduleError);
        throw new Error("Falha ao carregar a escala pública.");
      }

      // Busca todas as respostas relacionadas aos assignments desta escala
      const assignmentIds = scheduleData.assignments.map((a: any) => a.id);
      
      const { data: responses, error: responsesError } = await supabase
        .from('schedule_responses')
        .select('*')
        .in('schedule_assignment_id', assignmentIds);

      if (responsesError) {
        console.error("❌ Error fetching responses:", responsesError);
        // Não falha aqui, apenas continua sem respostas
      }

      console.log('📩 Respostas carregadas:', responses);

      // Mapeia as respostas para cada assignment
      const data = {
        ...scheduleData,
        assignments: scheduleData.assignments.map((assignment: any) => ({
          ...assignment,
          schedule_responses: responses?.filter(
            (r: any) => r.schedule_assignment_id === assignment.id
          ) || []
        }))
      };
      
      console.log('✅ Dados finais processados:', data);
      console.log('📦 Assignments completos:', data.assignments);
      
      // Log detalhado de cada assignment
      data.assignments.forEach((assignment: any) => {
        console.log(`📋 Assignment ${assignment.id}:`, {
          member: assignment.members?.name,
          responses: assignment.schedule_responses,
          responseCount: assignment.schedule_responses?.length || 0
        });
      });
      
      return data as PublicScheduleData;
    },
    enabled: !!scheduleId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};
