import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<'profiles'>;

/**
 * Hook para buscar o nome completo do proprietário da igreja.
 */
export const useOwnerProfile = (ownerId: string | null) => {
  return useQuery<Profile | null>({
    queryKey: ["ownerProfile", ownerId],
    queryFn: async () => {
      if (!ownerId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email') // Buscando email também
        .eq('id', ownerId)
        .single();

      if (error) {
        console.error("Error fetching owner profile:", error);
        return null;
      }
      
      return data;
    },
    enabled: !!ownerId,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
