import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar, Clock, List, Users, CheckCircle2, XCircle, AlertTriangle, Send, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSubmitScheduleResponse } from "@/hooks/useScheduleResponse";
import { useState, useEffect, useMemo } from "react";
import { Tables } from "@/integrations/supabase/types";
import Logo from "@/components/Logo"; // Importando Logo

type ResponseStatus = 'pending' | 'confirmed' | 'declined'; // Definido como string literal
type Assignment = Tables<'schedule_assignments'>;
type Schedule = Tables<'schedules'>;
type Member = Tables<'members'>;
type Ministry = Tables<'ministries'>;
type ScheduleResponse = Tables<'schedule_responses'>;

interface AssignmentDetails extends Assignment {
  schedules: (Schedule & { ministries: Pick<Ministry, 'name'> | null }) | null;
  members: Pick<Member, 'name' | 'function'> | null;
  schedule_responses: ScheduleResponse[];
}

// Hook para buscar detalhes da atribuição pelo token
const useAssignmentDetails = (token: string | null) => {
  return useQuery<AssignmentDetails | null>({
    queryKey: ["assignmentDetails", token],
    queryFn: async () => {
      if (!token) return null;

      const { data, error } = await supabase
        .from('schedule_assignments')
        .select(`
          *,
          schedules (
            event_date,
            event_time,
            observations,
            ministries(name)
          ),
          members(name, function),
          schedule_responses(*)
        `)
        .eq('response_token', token)
        .single();

      if (error) {
        console.error("Error fetching assignment details:", error);
        return null;
      }
      
      return data as AssignmentDetails;
    },
    enabled: !!token,
    // Configuração para comportamento "real-time": sempre busca, nunca usa cache obsoleto
    staleTime: 0,
    gcTime: 0,
  });
};

const PublicResponse = () => {
  const { token } = useParams<{ token: string }>();
  // Usando isFetching para cobrir o estado de recarregamento após a mutação
  const { data: assignment, isLoading, isFetching } = useAssignmentDetails(token || null);
  const submitResponseMutation = useSubmitScheduleResponse();
  const [notes, setNotes] = useState("");

  const schedule = assignment?.schedules;
  const member = assignment?.members;
  const response = assignment?.schedule_responses[0];
  
  // Derivar o status diretamente da resposta
  const currentStatus: ResponseStatus = useMemo(() => {
    return (response?.response_status || 'pending') as ResponseStatus;
  }, [response]);

  // Sincronizar notas do banco de dados para o estado local
  useEffect(() => {
    setNotes(response?.notes || "");
  }, [response]);

  const handleResponse = async (status: ResponseStatus) => {
    if (!token) return;
    
    try {
      await submitResponseMutation.mutateAsync({
        token,
        status,
        notes: notes,
      });
    } catch (error) {
      // Erro tratado pelo hook
    }
  };

  // Se estiver carregando a primeira vez OU recarregando após a mutação
  if (isLoading || isFetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!assignment || !schedule || !member) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full border-destructive/50 bg-destructive/5">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Link Inválido</h1>
          <p className="text-muted-foreground mb-6">
            O link de resposta pode estar incorreto ou expirado.
          </p>
          <Link to="/">
            <Button>Voltar para o Início</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const eventDate = new Date(schedule.event_date + 'T00:00:00');
  const formattedDate = format(eventDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const isSubmitting = submitResponseMutation.isPending;
  
  // Lógica para desabilitar botões se o status for o mesmo que o atual
  const isConfirmed = currentStatus === 'confirmed';
  const isDeclined = currentStatus === 'declined';
  
  const showActionButtons = !isSubmitting && !isFetching;

  return (
    <div className="min-h-screen bg-background py-12 px-4" style={{ background: "var(--gradient-hero)" }}>
      <div className="container mx-auto max-w-xl">
        {/* Header/Logo */}
        <div className="flex items-center justify-center mb-10">
          <Logo size="md" />
        </div>

        <Card className="p-8 md:p-10 shadow-2xl border-border/50" style={{ background: "var(--gradient-card)" }}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold mb-2 text-foreground">
              Olá, {member.name}!
            </h1>
            <p className="text-xl font-semibold text-muted-foreground">
              Você foi escalado(a) para o serviço.
            </p>
          </div>

          {/* Detalhes da Escala */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30 mb-6">
            <div className="flex items-center gap-3">
              <List className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Ministério</p>
                <p className="font-medium text-lg">{schedule.ministries?.name || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-medium text-lg">{formattedDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Horário</p>
                <p className="font-medium text-lg">{schedule.event_time.substring(0, 5)}</p>
              </div>
            </div>
            {schedule.observations && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
                  <MessageSquare className="w-4 h-4" /> Observações
                </p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{schedule.observations}</p>
              </div>
            )}
          </div>

          {/* Status Atual */}
          <div className="mb-6 text-center">
            <p className="text-sm font-medium mb-2">Status da Sua Resposta:</p>
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold",
              currentStatus === 'confirmed' && "bg-emerald-500/20 text-emerald-600 border border-emerald-500/50",
              currentStatus === 'declined' && "bg-destructive/20 text-destructive border border-destructive/50",
              currentStatus === 'pending' && "bg-amber-500/20 text-amber-600 border border-amber-500/50"
            )}>
              {currentStatus === 'confirmed' && <CheckCircle2 className="w-5 h-5" />}
              {currentStatus === 'declined' && <XCircle className="w-5 h-5" />}
              {currentStatus === 'pending' && <Clock className="w-5 h-5" />}
              {currentStatus === 'confirmed' && "Confirmado"}
              {currentStatus === 'declined' && "Recusado"}
              {currentStatus === 'pending' && "Pendente"}
            </div>
          </div>

          {/* Formulário de Resposta */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notas (Opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Ex: Posso chegar 15 minutos mais tarde, ou sugestão de substituto."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting || isFetching}
              />
            </div>

            {showActionButtons && (
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Button
                  type="button"
                  onClick={() => handleResponse('declined')}
                  variant="destructive"
                  disabled={isSubmitting || isFetching || isDeclined}
                  className="h-12"
                >
                  {isSubmitting && currentStatus !== 'confirmed' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="w-5 h-5 mr-2" />}
                  {isDeclined ? "Recusado" : "Recusar"}
                </Button>
                <Button
                  type="button"
                  onClick={() => handleResponse('confirmed')}
                  disabled={isSubmitting || isFetching || isConfirmed}
                  className="h-12 bg-emerald-500 hover:bg-emerald-600"
                >
                  {isSubmitting && currentStatus !== 'declined' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                  {isConfirmed ? "Confirmado" : "Confirmar Presença"}
                </Button>
              </div>
            )}
          </div>
        </Card>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Escala Ministerial - Gestão de Escalas Ministeriais</p>
          <Link to="/" className="text-primary hover:underline mt-1 block">
            Crie sua conta e organize sua igreja!
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PublicResponse;
