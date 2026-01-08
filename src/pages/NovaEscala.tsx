import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Users, Clock, Send, Loader2, X, Repeat, Lock, Share2, MessageSquare, Filter, List, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useChurch } from "@/hooks/useChurch";
import { useMinistries } from "@/hooks/useMinistryData";
import { useMembers } from "@/hooks/useMemberData";
import { TablesInsert, Enums } from "@/integrations/supabase/types";
import DashboardLayout from "@/components/DashboardLayout";
import { addWeeks, addMonths, parseISO, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateSchedule } from "@/hooks/useScheduleData";
import { useTemplates, useTemplateFunctions } from "@/pages/Templates";
import { useScheduleConflict } from "@/hooks/useScheduleConflict"; // Importando o hook de conflito
import { cn } from "@/lib/utils";

// Definindo os tipos de culto disponíveis
const EVENT_TYPES: Enums<'event_type'>[] = [
  'Culto de Pôr do Sol',
  'Escola Sabatina',
  'Culto Divino',
  'Culto Jovem',
  'Culto de Quarta',
  'Classe Bíblica',
  'JA (Sábado à tarde)',
  'Pequenos Grupos',
  'Vigília',
  'Santa Ceia',
  'Semana de Oração',
  'Semana Jovem',
  'Semana Santa',
  'Culto Missionário',
  'Batismo',
  'Programa Especial',
  'Ensaio de Louvor',
  'Reunião Administrativa',
  'Outro',
];

const NovaEscala = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { churchId, isLoading: isLoadingChurch, isBlocked } = useChurch();
  const { data: ministries, isLoading: isLoadingMinistries } = useMinistries(churchId);
  const { data: allMembers, isLoading: isLoadingMembers } = useMembers(churchId);
  const { data: templates, isLoading: isLoadingTemplates } = useTemplates(churchId);

  const createScheduleMutation = useCreateSchedule();
  const queryClient = useQueryClient();

  const [escala, setEscala] = useState({
    template_id: "" as string | null,
    ministry_id: "",
    event_type: EVENT_TYPES[0],
    event_date: format(new Date(), 'yyyy-MM-dd'),
    event_time: "19:00",
    observations: "",
    selectedMemberIds: [] as string[],
    isRecurring: false,
    recurrenceType: "weekly",
    recurrenceCount: 4,
  });

  const [selectedFunction, setSelectedFunction] = useState("all");

  const { data: templateFunctions, isLoading: isLoadingTemplateFunctions } = useTemplateFunctions(escala.template_id);

  // --- Lógica de Conflito ---
  const allMemberIds = useMemo(() => allMembers?.map(m => m.id) || [], [allMembers]);
  const { data: conflicts, isLoading: isLoadingConflicts } = useScheduleConflict(
    allMemberIds,
    escala.event_date,
    escala.event_time,
    null // Não há ID de escala atual ao criar uma nova
  );
  // --- Fim Lógica de Conflito ---

  if (isLoadingChurch) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!churchId || !user) {
    return <Navigate to="/auth" replace />;
  }

  const handleTemplateChange = (templateId: string) => {
    const selectedTemplate = templates?.find(t => t.id === templateId);

    if (selectedTemplate) {
      setEscala(prev => ({
        ...prev,
        template_id: templateId,
        event_type: selectedTemplate.event_type,
        event_time: selectedTemplate.event_time.substring(0, 5),
        observations: selectedTemplate.observations || "",
        // Não altera ministry_id ou event_date automaticamente, mas pode ser uma melhoria futura
      }));
    } else {
      // Se desmarcar o template
      setEscala(prev => ({
        ...prev,
        template_id: null,
        event_type: EVENT_TYPES[0],
        event_time: "19:00",
        observations: "",
      }));
    }
  };

  // Lista de funções únicas de TODOS os membros
  const uniqueFunctions = useMemo(() => {
    if (!allMembers) return [];
    const functions = new Set(
      allMembers
        .filter(m => m.function)
        .map(m => m.function)
    );
    return Array.from(functions).sort();
  }, [allMembers]);

  // Membros filtrados APENAS pela função selecionada (permite seleção cruzada de ministérios)
  const filteredMembers = useMemo(() => {
    if (!allMembers) return [];

    let members = allMembers;

    if (selectedFunction !== "all") {
      members = members.filter(m => m.function === selectedFunction);
    }

    return members;
  }, [allMembers, selectedFunction]);

  const handleSelectMember = (memberId: string) => {
    if (isBlocked) {
      toast.error("Acesso bloqueado. Faça um upgrade para criar escalas.");
      return;
    }
    setEscala(prev => {
      if (prev.selectedMemberIds.includes(memberId)) {
        return { ...prev, selectedMemberIds: prev.selectedMemberIds.filter(id => id !== memberId) };
      } else {
        return { ...prev, selectedMemberIds: [...prev.selectedMemberIds, memberId] };
      }
    });
  };

  // Função para selecionar todos os membros filtrados
  const handleSelectAllFiltered = () => {
    if (isBlocked) {
      toast.error("Acesso bloqueado. Faça um upgrade para criar escalas.");
      return;
    }
    const currentSelected = new Set(escala.selectedMemberIds);
    const membersToAdd = filteredMembers.filter(m => !currentSelected.has(m.id)).map(m => m.id);

    setEscala(prev => ({
      ...prev,
      selectedMemberIds: [...prev.selectedMemberIds, ...membersToAdd]
    }));
  };

  // Função para desmarcar todos os membros filtrados
  const handleDeselectAllFiltered = () => {
    if (isBlocked) {
      toast.error("Acesso bloqueado. Faça um upgrade para criar escalas.");
      return;
    }
    const membersToRemove = new Set(filteredMembers.map(m => m.id));

    setEscala(prev => ({
      ...prev,
      selectedMemberIds: prev.selectedMemberIds.filter(id => !membersToRemove.has(id))
    }));
  };

  const generateRecurrentDates = (startDateStr: string, type: string, count: number): string[] => {
    const dates: string[] = [];
    let currentDate = parseISO(startDateStr);

    for (let i = 0; i < count; i++) {
      // Adiciona a data atual (i=0) e as datas recorrentes (i>0)
      dates.push(format(currentDate, 'yyyy-MM-dd'));

      switch (type) {
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'biweekly':
          currentDate = addWeeks(currentDate, 2);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
        default:
          break;
      }
    }
    return dates;
  };

  const handleSalvar = async () => {
    if (isBlocked) {
      toast.error("Acesso bloqueado. Faça um upgrade para criar escalas.");
      return;
    }
    if (!escala.ministry_id || !escala.event_date || !escala.event_time) {
      toast.error("Por favor, preencha o Ministério, Data e Horário.");
      return;
    }

    if (escala.selectedMemberIds.length === 0) {
      toast.error("Selecione pelo menos um membro para a escala.");
      return;
    }

    const ministryName = ministries?.find(m => m.id === escala.ministry_id)?.name || "Serviço";

    const datesToCreate = escala.isRecurring
      ? generateRecurrentDates(escala.event_date, escala.recurrenceType, escala.recurrenceCount)
      : [escala.event_date];

    if (datesToCreate.length === 0) {
      toast.error("Nenhuma data válida para criar escalas.");
      return;
    }

    // --- Verificação de Conflitos (Apenas para a primeira data se for recorrente) ---

    const membersWithConflicts = escala.selectedMemberIds.filter(id => {
      const conflict = conflicts?.[id];
      return conflict?.isUnavailable || conflict?.isConflicting;
    });

    if (membersWithConflicts.length > 0) {
      const conflictNames = membersWithConflicts.map(id => allMembers?.find(m => m.id === id)?.name).join(', ');
      toast.error(`Conflito detectado na primeira data (${format(parseISO(escala.event_date), 'dd/MM')})! Os seguintes membros estão indisponíveis ou escalados em outro lugar: ${conflictNames}.`);
      // Não bloqueamos, apenas avisamos. O usuário pode prosseguir se for um conflito aceitável.
    }
    // --- Fim Verificação de Conflitos ---

    try {
      const schedulesToInsert: TablesInsert<'schedules'>[] = datesToCreate.map(date => ({
        church_id: churchId,
        created_by: user.id,
        ministry_id: escala.ministry_id,
        event_date: date,
        event_time: escala.event_time,
        observations: escala.observations,
        title: `${escala.event_type} de ${ministryName} em ${format(parseISO(date), 'dd/MM')}`,
        email_sent: false,
        event_type: escala.event_type,
      }));

      // 1. Insert all schedules
      const { data: newSchedules, error: scheduleError } = await supabase
        .from('schedules')
        .insert(schedulesToInsert)
        .select('id, event_date');

      if (scheduleError) throw scheduleError;

      // 2. Assign members to all new schedules, generating a unique token for each assignment
      if (escala.selectedMemberIds.length > 0 && newSchedules) {
        const assignmentPromises = newSchedules.flatMap(schedule =>
          escala.selectedMemberIds.map(memberId => {
            const assignmentData: TablesInsert<'schedule_assignments'> = {
              schedule_id: schedule.id,
              member_id: memberId,
              response_token: crypto.randomUUID(),
            };
            return supabase.from('schedule_assignments').insert(assignmentData);
          })
        );

        const results = await Promise.all(assignmentPromises);
        results.forEach(result => {
          if (result.error) throw result.error;
        });
      }

      // 3. Invalida o cache manualmente
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["allFutureSchedules"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["scheduleAssignments"] });

      const successMessage = escala.isRecurring
        ? `${newSchedules?.length || 0} escalas recorrentes criadas com sucesso!`
        : "Escala criada e membros atribuídos com sucesso!";

      toast.success(successMessage);

      navigate("/escalas");

    } catch (error) {
      console.error("Failed to save schedule:", error);
      toast.error("Erro ao salvar escala(s).");
    }
  };

  const isSaving = createScheduleMutation.isPending;
  const isActionDisabled = isSaving || isBlocked;
  const isTemplateLoading = isLoadingTemplates || isLoadingTemplateFunctions;
  const isDataLoading = isLoadingMembers || isLoadingMinistries || isLoadingConflicts;

  return (
    <DashboardLayout
      title="Nova Escala"
      description="Crie uma nova escala e atribua membros"
    >
      <div className="max-w-4xl mx-auto">
        <Card className="p-6">
          <div className="space-y-6">

            {/* Seleção de Template */}
            <div className="space-y-2 border p-4 rounded-lg bg-primary/5 border-primary/20">
              <Label htmlFor="template_id" className="text-sm font-medium flex items-center gap-2">
                <List className="w-4 h-4" />
                Usar Template de Escala (Opcional)
              </Label>
              <Select
                onValueChange={handleTemplateChange}
                value={escala.template_id || ""}
                disabled={isActionDisabled || isTemplateLoading}
              >
                <SelectTrigger id="template_id">
                  <SelectValue placeholder={isTemplateLoading ? "Carregando templates..." : "Selecione um template"} />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.event_type} às {t.event_time.substring(0, 5)})
                    </SelectItem>
                  ))}
                  {templates?.length === 0 && (
                    <SelectItem value="none" disabled>
                      Nenhum template encontrado.
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Link to="/templates" className="text-xs text-primary hover:underline block pt-1">
                Gerenciar Templates
              </Link>
            </div>

            {/* Tipo de Culto (Preenchido pelo template ou manual) */}
            <div>
              <Label htmlFor="event_type">Tipo de Culto/Evento *</Label>
              <Select
                onValueChange={(value) => setEscala({ ...escala, event_type: value as Enums<'event_type'> })}
                value={escala.event_type}
                disabled={isActionDisabled || !!escala.template_id} // Desabilita se template selecionado
              >
                <SelectTrigger id="event_type">
                  <SelectValue placeholder="Selecione o tipo de evento" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start" sideOffset={4}>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!!escala.template_id && <p className="text-xs text-muted-foreground mt-1">Preenchido pelo template.</p>}
            </div>

            {/* Ministerio e Data */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <Label htmlFor="ministry_id">Ministério Principal da Escala *</Label>
                <Select
                  onValueChange={(value) => {
                    // Ao mudar o ministério principal, limpamos a seleção de membros
                    // para evitar confusão, mas mantemos a seleção cruzada possível.
                    setEscala({ ...escala, ministry_id: value, selectedMemberIds: [] });
                    setSelectedFunction("all"); // Resetar filtro de função
                  }}
                  value={escala.ministry_id}
                  disabled={isActionDisabled || isLoadingMinistries}
                >
                  <SelectTrigger id="ministry_id">
                    <SelectValue placeholder={isLoadingMinistries ? "Carregando..." : "Selecione o ministério"} />
                  </SelectTrigger>
                  <SelectContent>
                    {ministries?.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!!escala.template_id && !escala.ministry_id && (
                  <p className="text-xs text-destructive mt-1">Obrigatório: Selecione o ministério responsável pela escala.</p>
                )}
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="event_date">Data do Culto/Evento *</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={escala.event_date}
                  onChange={(e) =>
                    setEscala({ ...escala, event_date: e.target.value })
                  }
                  disabled={isActionDisabled}
                />
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="event_time">Horário *</Label>
                <Input
                  id="event_time"
                  type="time"
                  value={escala.event_time}
                  onChange={(e) =>
                    setEscala({ ...escala, event_time: e.target.value })
                  }
                  disabled={isActionDisabled || !!escala.template_id} // Desabilita se template selecionado
                />
                {!!escala.template_id && <p className="text-xs text-muted-foreground mt-1">Preenchido pelo template.</p>}
              </div>
            </div>

            {/* Recorrência */}
            <div className="space-y-3 border p-4 rounded-lg bg-muted/20">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRecurring"
                  checked={escala.isRecurring}
                  onCheckedChange={(checked) => setEscala({ ...escala, isRecurring: !!checked })}
                  disabled={isActionDisabled}
                />
                <Label htmlFor="isRecurring" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                  <Repeat className="w-4 h-4" />
                  Escala Recorrente?
                </Label>
              </div>

              {escala.isRecurring && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <Label htmlFor="recurrenceType">Repetir a cada</Label>
                    <Select
                      onValueChange={(value) => setEscala({ ...escala, recurrenceType: value as "weekly" | "biweekly" | "monthly" })}
                      value={escala.recurrenceType}
                      disabled={isActionDisabled}
                    >
                      <SelectTrigger id="recurrenceType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Semana</SelectItem>
                        <SelectItem value="biweekly">Duas Semanas</SelectItem>
                        <SelectItem value="monthly">Mês</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="recurrenceCount">Número de Repetições</Label>
                    <Input
                      id="recurrenceCount"
                      type="number"
                      min="1"
                      value={escala.recurrenceCount}
                      onChange={(e) => setEscala({ ...escala, recurrenceCount: parseInt(e.target.value) || 1 })}
                      disabled={isActionDisabled}
                    />
                  </div>
                  <p className="col-span-2 text-xs text-muted-foreground">
                    Serão criadas {escala.recurrenceCount} escalas, começando em {format(parseISO(escala.event_date), 'dd/MM/yyyy')}.
                  </p>
                </div>
              )}
            </div>

            {/* Membros */}
            <div>
              <Label>Membros Escalados ({escala.selectedMemberIds.length})</Label>
              <Card className="p-4 mt-2 bg-muted/30">
                {!escala.ministry_id ? (
                  <div className="text-center text-muted-foreground py-4">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Selecione um ministério principal para a escala.</p>
                  </div>
                ) : isDataLoading ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">Carregando membros e conflitos...</p>
                  </div>
                ) : filteredMembers.length === 0 && selectedFunction !== "all" ? (
                  <div className="text-center text-muted-foreground py-4">
                    <p>Nenhum membro encontrado com a função "{selectedFunction}".</p>
                    <Button variant="link" onClick={() => setSelectedFunction("all")} className="text-primary text-sm mt-2">
                      Mostrar todos os membros
                    </Button>
                  </div>
                ) : filteredMembers.length === 0 && selectedFunction === "all" && uniqueFunctions.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    <p>Nenhum membro cadastrado na igreja.</p>
                    <Link to="/membros" className="text-primary text-sm hover:underline mt-2 block">
                      Cadastrar membros
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Funções Requeridas pelo Template */}
                    {templateFunctions && templateFunctions.length > 0 && (
                      <div className="p-3 border border-primary/30 rounded-lg bg-primary/10 space-y-2">
                        <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
                          <List className="w-4 h-4" />
                          Funções Requeridas (Template)
                        </h4>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-primary/90">
                          {templateFunctions.map(f => (
                            <span key={f.id} className="font-medium">
                              {f.function_name}: <span className="font-bold">{f.required_count}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Filtro de Função */}
                    {uniqueFunctions.length > 0 && (
                      <div className="flex items-center gap-3">
                        <Select
                          onValueChange={setSelectedFunction}
                          value={selectedFunction}
                          disabled={isActionDisabled}
                        >
                          <SelectTrigger className="w-[200px] bg-background/50">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Filtrar por função" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas as Funções</SelectItem>
                            {uniqueFunctions.map((func) => (
                              <SelectItem key={func} value={func}>
                                {func}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Botões de Seleção Rápida */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleSelectAllFiltered}
                          disabled={isActionDisabled || filteredMembers.length === 0}
                        >
                          Selecionar Todos ({filteredMembers.length})
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDeselectAllFiltered}
                          disabled={isActionDisabled || filteredMembers.length === 0}
                        >
                          Limpar Filtro
                        </Button>
                      </div>
                    )}

                    <p className="text-sm font-medium text-foreground">Clique para selecionar/remover:</p>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                      {filteredMembers.map((member) => {
                        const conflict = conflicts?.[member.id];
                        const isSelected = escala.selectedMemberIds.includes(member.id);
                        const hasConflict = conflict?.isUnavailable || conflict?.isConflicting;

                        let variant: "default" | "outline" | "destructive" = isSelected ? "default" : "outline";
                        let icon = isSelected ? <X className="w-3 h-3 ml-1" /> : null;
                        let tooltipText = "";

                        if (isSelected && conflict?.isUnavailable) {
                          variant = "destructive";
                          icon = <AlertTriangle className="w-3 h-3 ml-1" />;
                          tooltipText = "Indisponível nesta data!";
                        } else if (isSelected && conflict?.isConflicting) {
                          variant = "destructive";
                          icon = <AlertTriangle className="w-3 h-3 ml-1" />;
                          tooltipText = "Conflito: Já escalado em outro serviço!";
                        } else if (isSelected) {
                          icon = <CheckCircle2 className="w-3 h-3 ml-1" />;
                        }

                        return (
                          <Button
                            key={member.id}
                            variant={variant}
                            size="sm"
                            onClick={() => handleSelectMember(member.id)}
                            disabled={isActionDisabled}
                            className={cn(
                              "transition-all duration-200",
                              hasConflict && isSelected && "bg-destructive/80 hover:bg-destructive",
                              isSelected && !hasConflict && "shadow-md ring-2 ring-primary/20"
                            )}
                            title={tooltipText || undefined}
                          >
                            {member.name}
                            {member.function && <span className="ml-2 text-xs opacity-70">({member.function})</span>}
                            {icon}
                          </Button>
                        );
                      })}
                    </div>
                    {(Object.values(conflicts || {}).some(c => c.isUnavailable || c.isConflicting)) && (
                      <div className="mt-3 text-xs text-destructive flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Membros marcados em vermelho estão indisponíveis ou em conflito na primeira data.
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* Observações */}
            <div>
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                placeholder="Tema do culto, vestimenta especial, local..."
                rows={4}
                value={escala.observations}
                onChange={(e) =>
                  setEscala({ ...escala, observations: e.target.value })
                }
                disabled={isActionDisabled || !!escala.template_id} // Desabilita se template selecionado
              />
              {!!escala.template_id && <p className="text-xs text-muted-foreground mt-1">Preenchido pelo template.</p>}
            </div>

            {isBlocked && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive text-sm flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Acesso bloqueado. Faça um upgrade para criar escalas.
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSalvar} className="flex-1" disabled={isActionDisabled || isDataLoading}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Escala
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/escalas")}
                disabled={isActionDisabled}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Card>

        {/* Novo Card de Sugestão de Compartilhamento */}
        <Card className="p-4 mt-6 bg-primary/5 border-primary/20">
          <div className="flex gap-3">
            <Share2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-primary mb-1">Próximo Passo: Compartilhar</p>
              <p className="text-muted-foreground">
                Após salvar, você será redirecionado para a lista de escalas, onde poderá
                compartilhar o link público da escala ou enviar a notificação via WhatsApp.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default NovaEscala;
