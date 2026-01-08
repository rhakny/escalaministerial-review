import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type UserRole = Tables<'user_roles'>;
type Profile = Tables<'profiles'>;

export interface ChurchAdmin extends UserRole {
  profiles: Pick<Profile, 'full_name' | 'email'> | null;
}

/**
 * Hook para buscar todos os usuários com papel de 'church_admin' ou 'ministry_leader'
 * associados à igreja atual.
 */
export const useChurchAdmins = (churchId: string | null) => {
  return useQuery<ChurchAdmin[]>({
    queryKey: ["churchAdmins", churchId],
    queryFn: async () => {
      if (!churchId) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          profiles(full_name, email)
        `)
        .eq('church_id', churchId)
        .in('role', ['church_admin', 'ministry_leader'])
        .order('role', { ascending: false }); // Admins primeiro

      if (error) {
        console.error("Error fetching church admins:", error);
        throw new Error("Não foi possível carregar os administradores da igreja.");
      }
      
      // Filtra perfis nulos e garante o tipo
      return data.filter(item => item.profiles !== null) as ChurchAdmin[];
    },
    enabled: !!churchId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
