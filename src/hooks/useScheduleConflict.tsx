import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";

type MemberAvailability = Tables<'member_availability'>;
type ScheduleAssignment = Tables<'schedule_assignments'>;

interface ConflictCheckResult {
  isUnavailable: boolean;
  isConflicting: boolean;
}

/**
 * Hook para buscar a disponibilidade e conflitos de agendamento para um conjunto de membros em uma data/hora específica.
 * @param memberIds Lista de IDs de membros a serem verificados.
 * @param date Data do evento (YYYY-MM-DD).
 * @param time Hora do evento (HH:MM).
 * @param currentScheduleId ID da escala atual (para ignorar conflito consigo mesma).
 */
export const useScheduleConflict = (
  memberIds: string[],
  date: string | null,
  time: string | null,
  currentScheduleId: string | null = null
) => {
  // Se o tempo for fornecido como HH:MM, adicionamos :00 para garantir a comparação exata no banco de dados,
  // já que o tipo 'time without time zone' armazena segundos.
  const fullTime = time ? `${time}:00` : null;
  const dateKey = date && fullTime ? `${date}T${fullTime}` : null;

  return useQuery<Record<string, ConflictCheckResult>>({
    queryKey: ["scheduleConflicts", memberIds, dateKey, currentScheduleId],
    queryFn: async () => {
      if (!date || !fullTime || memberIds.length === 0) {
        return {};
      }

      const results: Record<string, ConflictCheckResult> = {};

      // 1. Checar Indisponibilidade (member_availability)
      const { data: unavailability, error: unavailError } = await supabase
        .from('member_availability')
        .select('member_id')
        .in('member_id', memberIds)
        .eq('date', date)
        .eq('available', false);

      if (unavailError) {
        console.error("Error fetching unavailability:", unavailError);
        throw new Error("Falha ao checar indisponibilidade.");
      }

      const unavailableMemberIds = new Set(unavailability.map(u => u.member_id));

      // 2. Checar Conflitos de Escala (schedule_assignments)
      
      // Buscar escalas existentes na mesma data e hora
      let query = supabase
        .from('schedules')
        .select('id')
        .eq('event_date', date)
        .eq('event_time', fullTime); // Usando fullTime (HH:MM:00)
      
      // Excluir a escala atual se estivermos editando
      if (currentScheduleId) {
        query = query.neq('id', currentScheduleId);
      }

      const { data: conflictingSchedules, error: scheduleError } = await query;

      if (scheduleError) {
        console.error("Error fetching conflicting schedules:", scheduleError);
        throw new Error("Falha ao checar conflitos de escala.");
      }

      const conflictingScheduleIds = conflictingSchedules.map(s => s.id);
      let conflictingMemberIds = new Set<string>();

      if (conflictingScheduleIds.length > 0) {
        const { data: assignments, error: assignmentError } = await supabase
          .from('schedule_assignments')
          .select('member_id')
          .in('schedule_id', conflictingScheduleIds)
          .in('member_id', memberIds);
        
        if (assignmentError) {
          console.error("Error fetching conflicting assignments:", assignmentError);
          throw new Error("Falha ao checar atribuições conflitantes.");
        }
        
        assignments.forEach(a => conflictingMemberIds.add(a.member_id));
      }

      // 3. Compilar Resultados
      memberIds.forEach(id => {
        results[id] = {
          isUnavailable: unavailableMemberIds.has(id),
          isConflicting: conflictingMemberIds.has(id),
        };
      });

      return results;
    },
    enabled: !!date && !!fullTime && memberIds.length > 0,
    staleTime: 1000 * 10, // 10 seconds
  });
};
