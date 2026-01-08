import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Loader2 } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

type Church = Tables<'churches'>;

interface ChurchContextType {
  churchId: string | null;
  church: Church | null;
  isLoading: boolean;
  isTrialActive: boolean;
  daysLeftInTrial: number;
  isSubscriptionActive: boolean; // Indica se o acesso premium está ativo (pago ou trial)
  daysLeftInSubscription: number; // Dias restantes para o fim do acesso premium/trial
  isBlocked: boolean; // Indica se o acesso às funcionalidades deve ser bloqueado
}

const ChurchContext = createContext<ChurchContextType | undefined>(undefined);

// Hook para buscar o ID da igreja principal do usuário
const useUserChurchId = (userId: string | null) => {
  return useQuery<string | null>({
    queryKey: ["userChurchId", userId],
    queryFn: async () => {
      if (!userId) return null;

      // Usa a função RPC para obter o ID da igreja principal
      const { data, error } = await supabase.rpc('get_user_church_id', { _user_id: userId });

      if (error) {
        console.error("Error fetching user church ID:", error);
        return null;
      }

      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook para buscar os detalhes da igreja
const useChurchDetails = (churchId: string | null) => {
  return useQuery<Church | null>({
    queryKey: ["churchDetails", churchId],
    queryFn: async () => {
      if (!churchId) return null;

      const { data, error } = await supabase
        .from('churches')
        .select('*')
        .eq('id', churchId)
        .single();

      if (error) {
        // Se a igreja não for encontrada (ex: foi excluída), retorna null
        if (error.code === 'PGRST116') return null;
        console.error("Error fetching church details:", error);
        throw new Error("Falha ao carregar detalhes da igreja.");
      }

      return data;
    },
    enabled: !!churchId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};


export const ChurchProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { data: churchId, isLoading: isLoadingChurchId } = useUserChurchId(user?.id || null);
  const { data: church, isLoading: isLoadingChurchDetails } = useChurchDetails(churchId);

  // --- Lógica de Assinatura e Bloqueio ---

  const TRIAL_DAYS = 15;
  let daysLeftInTrial = 0;
  let daysLeftInSubscription = 0;
  let isTrialActive = false;
  let isSubscriptionActive = false; // Indica se o acesso premium está ativo (pago ou trial)
  let isBlocked = true;

  if (church) {
    const isFreePlan = church.subscription_plan === 'free';

    if (isFreePlan) {
      // Caso 1: Plano 'free' (Trial ou Cancelado)

      if (church.subscription_end_date) {
        // Caso 1a: Plano 'free' com data de expiração futura (Cancelamento de plano pago)
        const endDate = parseISO(church.subscription_end_date);
        daysLeftInSubscription = differenceInDays(endDate, new Date());
        isSubscriptionActive = daysLeftInSubscription >= 0; // Acesso premium mantido até o fim
        isBlocked = !isSubscriptionActive;

      } else if (church.trial_start_date) {
        // Caso 1b: Plano 'free' com data de início de trial (Trial puro)
        daysLeftInTrial = TRIAL_DAYS - differenceInDays(new Date(), parseISO(church.trial_start_date));
        isTrialActive = daysLeftInTrial >= 0;
        isSubscriptionActive = isTrialActive; // No trial, o acesso premium é o trial
        daysLeftInSubscription = daysLeftInTrial; // Usamos daysLeftInTrial para o banner
        isBlocked = !isTrialActive;
      } else {
        // Caso 1c: Plano 'free' sem datas (Erro ou estado inicial, assume bloqueado)
        isBlocked = true;
      }

    } else {
      // Caso 2: Plano Pago ('basic', 'pro', 'premium')

      if (church.subscription_end_date) {
        const endDate = parseISO(church.subscription_end_date);
        daysLeftInSubscription = differenceInDays(endDate, new Date());
        isSubscriptionActive = daysLeftInSubscription >= 0;
        isBlocked = !isSubscriptionActive;
      } else {
        // Plano pago sem data de expiração (Erro, assume ativo por segurança)
        isSubscriptionActive = true;
        isBlocked = false;
      }
    }
  }
  // --- Fim da Lógica de Assinatura e Bloqueio ---


  const isLoading = authLoading || isLoadingChurchId || isLoadingChurchDetails;

  console.log("ChurchProvider status:", {
    authLoading,
    isLoadingChurchId,
    isLoadingChurchDetails,
    isLoading,
    user: !!user,
    churchId: !!churchId,
    church: !!church
  });

  // Se o usuário está autenticado, mas ainda estamos carregando, mostramos o spinner.
  if (user && isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se o usuário não está autenticado, o ProtectedRoute acima do ChurchProvider
  // deve lidar com o redirecionamento.
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ChurchContext.Provider
      value={{
        churchId,
        church,
        isLoading,
        isTrialActive,
        daysLeftInTrial,
        isSubscriptionActive,
        daysLeftInSubscription,
        isBlocked,
      }}
    >
      {children}
    </ChurchContext.Provider>
  );
};

export const useChurch = () => {
  const context = useContext(ChurchContext);
  if (context === undefined) {
    throw new Error("useChurch must be used within a ChurchProvider");
  }
  return context;
};
