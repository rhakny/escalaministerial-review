import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface DashboardStats {
  activeSchedules: number;
  ministries: number;
  members: number;
}

export const useDashboardStats = (churchId: string | null) => {
  return useQuery<DashboardStats>({
    queryKey: ["dashboardStats", churchId],
    queryFn: async () => {
      if (!churchId) {
        return { activeSchedules: 0, ministries: 0, members: 0 };
      }

      // Fetch Ministries Count
      const { count: ministriesCount, error: minError } = await supabase
        .from('ministries')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', churchId);
      
      if (minError) throw minError;

      // Fetch Members Count
      const { count: membersCount, error: memError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', churchId);

      if (memError) throw memError;

      // Fetch Active Schedules Count (future dates)
      const today = format(new Date(), 'yyyy-MM-dd');
      const { count: schedulesCount, error: schError } = await supabase
        .from('schedules')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', churchId)
        .gte('event_date', today);

      if (schError) throw schError;

      return {
        activeSchedules: schedulesCount || 0,
        ministries: ministriesCount || 0,
        members: membersCount || 0,
      };
    },
    enabled: !!churchId,
    staleTime: 1000 * 60, // 1 minute
  });
};
