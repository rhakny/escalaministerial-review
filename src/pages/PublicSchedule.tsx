import { useParams, Link } from "react-router-dom";
import { usePublicSchedule } from "@/hooks/usePublicSchedule";
import { Loader2, Calendar, Clock, List, Users, MapPin, AlertTriangle, Printer, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tables } from "@/integrations/supabase/types";
import { usePublicConfirmation } from "@/hooks/usePublicConfirmation";
import { useEffect } from "react";
import Logo from "@/components/Logo"; // Importando Logo

// Tipos de dados necessários para a resposta
type ScheduleResponse = Tables<'schedule_responses'>;
type Assignment = Tables<'schedule_assignments'> & {
  members: { name: string; function: string | null } | null;
  schedule_responses: ScheduleResponse[];
};

interface PublicScheduleData extends Tables<'schedules'> {
  ministries: { name: string } | null;
  assignments: Assignment[];
}

const PublicSchedule = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();

  console.log('🔑 scheduleId da URL:', scheduleId);

  const { data: schedule, isLoading, isFetching, refetch } = usePublicSchedule(scheduleId || null);
  const confirmationMutation = usePublicConfirmation();

  // Log sempre que schedule mudar
  useEffect(() => {
    console.log('📊 Schedule atualizado:', schedule);
    if (schedule?.assignments) {
      console.log('👥 Assignments:', schedule.assignments.map(a => ({
        name: a.members?.name,
        responses: a.schedule_responses
      })));
    }
  }, [schedule]);

  const handlePrint = () => {
    window.print();
  };

  const handleConfirm = async (assignmentId: string) => {
    console.log('🟢 Confirmando assignment:', assignmentId);
    try {
      await confirmationMutation.mutateAsync({ assignmentId, status: 'confirmed' });
      // Força refetch manual após sucesso
      console.log('🔄 Forçando refetch...');
      await refetch();
    } catch (error) {
      console.error('❌ Erro ao confirmar:', error);
    }
  };

  const handleDecline = async (assignmentId: string) => {
    console.log('🔴 Recusando assignment:', assignmentId);
    try {
      await confirmationMutation.mutateAsync({ assignmentId, status: 'declined' });
      // Força refetch manual após sucesso
      console.log('🔄 Forçando refetch...');
      await refetch();
    } catch (error) {
      console.error('❌ Erro ao recusar:', error);
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

  if (!schedule) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full border-destructive/50 bg-destructive/5">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Escala Não Encontrada</h1>
          <p className="text-muted-foreground mb-6">
            O link da escala pode estar incorreto, expirado ou a escala foi excluída.
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

  // Filtra e mapeia as atribuições, garantindo que o ID e o membro existam
  const assignmentsWithStatus = schedule.assignments
    .filter(a => a.members !== null && !!a.id)
    .map(assignment => {
      const response = assignment.schedule_responses?.[0];
      const status = (response?.response_status || 'pending') as 'pending' | 'confirmed' | 'declined';
      const notes = response?.notes || null;

      console.log(`👤 ${assignment.members?.name}: status=${status}, response=`, response);

      return {
        ...assignment,
        member: assignment.members!,
        status,
        notes,
      };
    })
    .sort((a, b) => (a.member?.name || '').localeCompare(b.member?.name || ''));

  const confirmedCount = assignmentsWithStatus.filter(a => a.status === 'confirmed').length;
  const declinedCount = assignmentsWithStatus.filter(a => a.status === 'declined').length;
  const pendingCount = assignmentsWithStatus.length - confirmedCount - declinedCount;

  const isMutating = confirmationMutation.isPending;

  return (
    <div className="min-h-screen bg-background py-12 px-4 print:p-0 print:min-h-0" style={{ background: "var(--gradient-hero)" }}>
      <div className="container mx-auto max-w-3xl print:max-w-full print:w-full">
        <div className="flex items-center justify-center mb-10 print:hidden">
          <Logo size="md" />
        </div>

        <Card className="p-8 md:p-10 shadow-2xl border-border/50 print:shadow-none print:border-none print:p-0 print:bg-transparent" style={{ background: "var(--gradient-card)" }}>
          <div className="text-center mb-8 print:mb-4">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-foreground print:text-black print:text-3xl">
              {schedule.event_type}
            </h1>
            <p className="text-xl font-semibold text-primary mb-4 print:text-lg print:text-gray-700">
              {formattedDate}
            </p>
          </div>

          <div className="space-y-6 print:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-4 border-border/50 print:border-gray-300 print:pb-2">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-secondary print:text-gray-600" />
                <div>
                  <p className="text-sm text-muted-foreground print:text-gray-500">Horário</p>
                  <p className="font-medium text-lg print:text-black print:text-base">{schedule.event_time.substring(0, 5)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <List className="w-5 h-5 text-secondary print:text-gray-600" />
                <div>
                  <p className="text-sm text-muted-foreground print:text-gray-500">Ministério</p>
                  <p className="font-medium text-lg print:text-black print:text-base">{schedule.ministries?.name || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 print:hidden">
              <Card className="p-3 text-center bg-emerald-500/10 border-emerald-500/50">
                <p className="text-2xl font-bold text-emerald-600">{confirmedCount}</p>
                <p className="text-xs text-muted-foreground">Confirmados</p>
              </Card>
              <Card className="p-3 text-center bg-destructive/10 border-destructive/50">
                <p className="text-2xl font-bold text-destructive">{declinedCount}</p>
                <p className="text-xs text-muted-foreground">Recusados</p>
              </Card>
              <Card className="p-3 text-center bg-amber-500/10 border-amber-500/50">
                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </Card>
            </div>

            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 text-primary print:hidden flex items-start gap-3">
              <Users className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">
                Se você é um membro escalado, use os botões abaixo para confirmar ou recusar sua presença.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground print:text-black print:text-xl print:mb-2">
                <Users className="w-6 h-6 text-primary print:text-gray-600" />
                Membros Escalados ({assignmentsWithStatus.length})
              </h2>

              {assignmentsWithStatus.length > 0 ? (
                <div className="grid sm:grid-cols-1 gap-3">
                  {assignmentsWithStatus.map((assignment) => {
                    const isConfirmed = assignment.status === 'confirmed';
                    const isDeclined = assignment.status === 'declined';
                    const isPending = assignment.status === 'pending';

                    const isUpdatingThis = isMutating && confirmationMutation.variables?.assignmentId === assignment.id;

                    return (
                      <div
                        key={assignment.id}
                        className={cn(
                          "p-4 rounded-lg border flex flex-col gap-3 relative print:p-2 print:border print:border-gray-300 print:bg-white",
                          isConfirmed && "bg-emerald-500/5 border-emerald-500/20",
                          isDeclined && "bg-destructive/5 border-destructive/20",
                          isPending && "bg-muted/50 border-border/50"
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 print:hidden">
                            {assignment.member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-base print:text-sm print:font-semibold">{assignment.member.name}</p>
                            {assignment.member.function && (
                              <p className="text-xs text-muted-foreground print:text-gray-500">{assignment.member.function}</p>
                            )}
                          </div>
                        </div>

                        {/* Status Badge - Mobile */}
                        {!isUpdatingThis && (
                          <div className="flex justify-end sm:hidden">
                            {isConfirmed && (
                              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 px-2 py-1 bg-emerald-500/10 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> Confirmado
                              </span>
                            )}
                            {isDeclined && (
                              <span className="flex items-center gap-1 text-xs font-semibold text-destructive px-2 py-1 bg-destructive/10 rounded-full">
                                <XCircle className="w-3 h-3" /> Recusado
                              </span>
                            )}
                            {isPending && (
                              <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 px-2 py-1 bg-amber-500/10 rounded-full">
                                <Clock className="w-3 h-3" /> Pendente
                              </span>
                            )}
                          </div>
                        )}

                        {/* Botões de Ação */}
                        <div className="flex items-center gap-2 w-full sm:w-auto print:hidden">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDecline(assignment.id)}
                            disabled={isMutating || (isDeclined && !isUpdatingThis)}
                            className={cn(
                              "h-9 px-3 flex-1 sm:flex-none",
                              isDeclined && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {isUpdatingThis && confirmationMutation.variables?.status === 'declined' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
                            Recusar
                          </Button>

                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleConfirm(assignment.id)}
                            disabled={isMutating || (isConfirmed && !isUpdatingThis)}
                            className={cn(
                              "h-9 px-3 flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-600",
                              isConfirmed && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            {isUpdatingThis && confirmationMutation.variables?.status === 'confirmed' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                            Confirmar
                          </Button>

                          {/* Status Badge - Desktop */}
                          {!isUpdatingThis && (
                            <div className="hidden sm:flex">
                              {isConfirmed && (
                                <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                                  <CheckCircle2 className="w-4 h-4" /> Confirmado
                                </span>
                              )}
                              {isDeclined && (
                                <span className="flex items-center gap-1 text-sm font-semibold text-destructive">
                                  <XCircle className="w-4 h-4" /> Recusado
                                </span>
                              )}
                              {isPending && (
                                <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                                  <Clock className="w-4 h-4" /> Pendente
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="hidden print:block text-right">
                          {isConfirmed && <span className="text-xs font-semibold text-emerald-700">Confirmado</span>}
                          {isDeclined && <span className="text-xs font-semibold text-destructive">Recusado</span>}
                          {isPending && <span className="text-xs font-semibold text-amber-700">Pendente</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground italic print:text-gray-500">Nenhum membro atribuído a esta escala.</p>
              )}
            </div>

            {schedule.observations && (
              <div>
                <h2 className="text-2xl font-bold mb-3 flex items-center gap-2 text-foreground print:text-black print:text-xl print:mb-2">
                  <MapPin className="w-6 h-6 text-primary print:text-gray-600" />
                  Observações
                </h2>
                <Card className="p-4 bg-muted/50 border-border/50 print:p-3 print:border print:border-gray-300 print:bg-white">
                  <p className="text-muted-foreground whitespace-pre-wrap print:text-black print:text-sm">{schedule.observations}</p>
                </Card>
              </div>
            )}
          </div>
        </Card>

        <div className="mt-8 text-center space-y-4 print:hidden">
          <Button onClick={handlePrint} className="w-full max-w-xs">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Escala
          </Button>
          <div className="text-sm text-muted-foreground">
            <p>Escala Ministerial - Gestão de Escalas Ministeriais</p>
            <Link to="/" className="text-primary hover:underline mt-1 block">
              Crie sua conta e organize sua igreja!
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicSchedule;
