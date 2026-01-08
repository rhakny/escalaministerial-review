import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, Edit, Loader2, Clock, X, Plus, List, Trash, AlertTriangle, CheckCircle2, Users, Search, Filter, ChevronRight, MapPin, Sparkles, Share2, Lock } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useChurch } from "@/hooks/useChurch";
import { useAllFutureSchedules, ScheduleWithMinistry, useUpdateSchedule, useAssignMembersToSchedule, useScheduleAssignments, useDeleteSchedule } from "@/hooks/useScheduleData";
import { useMinistries } from "@/hooks/useMinistryData";
import { useMembers } from "@/hooks/useMemberData";
import { TablesUpdate, TablesInsert, Enums } from "@/integrations/supabase/types";
import { format, parseISO } from "date-fns"; // Importando parseISO
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { useScheduleConflict } from "@/hooks/useScheduleConflict";
import { cn } from "@/lib/utils";
import ShareScheduleButton from "@/components/ShareScheduleButton";
import { supabase } from "@/integrations/supabase/client";

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

// Enhanced Premium Calendar Component
const PremiumCalendar = ({
  schedules,
  onSelectSchedule
}: {
  schedules: ScheduleWithMinistry[],
  onSelectSchedule: (s: ScheduleWithMinistry) => void
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getSchedulesForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return schedules.filter(s => s.event_date === dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="bg-gradient-to-br from-background via-background to-primary/5 rounded-2xl p-8 border border-border/50 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 backdrop-blur-sm">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <p className="text-sm text-muted-foreground">
              {schedules.length} escala{schedules.length !== 1 ? 's' : ''} neste período
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevMonth}
            className="hover:bg-primary/10 hover:border-primary/30 transition-all"
          >
            ←
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="hover:bg-primary/10 hover:border-primary/30 transition-all"
          >
            Hoje
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextMonth}
            className="hover:bg-primary/10 hover:border-primary/30 transition-all"
          >
            →
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day names */}
        {dayNames.map((day) => (
          <div key={day} className="text-center py-3 text-sm font-semibold text-muted-foreground">
            {day}
          </div>
        ))}

        {/* Empty cells */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const daySchedules = getSchedulesForDay(day);
          const today = isToday(day);

          return (
            <div
              key={day}
              className={cn(
                "aspect-square rounded-xl border transition-all duration-200 hover:shadow-lg",
                today
                  ? "bg-gradient-to-br from-primary/20 to-primary/10 border-primary/50 shadow-md ring-2 ring-primary/30"
                  : daySchedules.length > 0
                    ? "bg-gradient-to-br from-accent/50 to-accent/20 border-accent hover:border-accent/70"
                    : "bg-card/50 border-border/30 hover:bg-accent/30 hover:border-accent/50"
              )}
            >
              <div className="h-full flex flex-col p-2">
                <span className={cn(
                  "text-sm font-medium mb-1",
                  today ? "text-primary font-bold" : "text-foreground"
                )}>
                  {day}
                </span>

                {daySchedules.length > 0 && (
                  <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                    {daySchedules.slice(0, 3).map((schedule) => (
                      <button
                        key={schedule.id}
                        onClick={() => onSelectSchedule(schedule)}
                        className="text-left text-[10px] leading-tight p-1.5 rounded-md bg-primary/90 text-primary-foreground hover:bg-primary transition-colors backdrop-blur-sm font-medium truncate"
                        title={schedule.title || schedule.ministries?.name}
                      >
                        {schedule.event_time.substring(0, 5)} {schedule.ministries?.name}
                      </button>
                    ))}
                    {daySchedules.length > 3 && (
                      <span className="text-[9px] text-muted-foreground text-center">
                        +{daySchedules.length - 3} mais
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Enhanced Premium List View
const PremiumListView = ({
  schedules,
  onSelectSchedule,
  ministries
}: {
  schedules: ScheduleWithMinistry[],
  onSelectSchedule: (s: ScheduleWithMinistry) => void,
  ministries: any[]
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMinistry, setFilterMinistry] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "ministry">("date");

  const filteredSchedules = useMemo(() => {
    let result = [...schedules];

    // Search filter
    if (searchTerm) {
      result = result.filter(s =>
        s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.ministries?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.observations?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.event_type.toLowerCase().includes(searchTerm.toLowerCase()) // NOVO: Busca por tipo de evento
      );
    }

    // Ministry filter
    if (filterMinistry !== "all") {
      result = result.filter(s => s.ministry_id === filterMinistry);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "date") {
        // Usando parseISO para garantir que a data seja tratada corretamente
        return parseISO(a.event_date).getTime() - parseISO(b.event_date).getTime();
      } else {
        return (a.ministries?.name || "").localeCompare(b.ministries?.name || "");
      }
    });

    return result;
  }, [schedules, searchTerm, filterMinistry, sortBy]);

  const groupedSchedules = useMemo(() => {
    const groups: { [key: string]: ScheduleWithMinistry[] } = {};

    filteredSchedules.forEach(schedule => {
      // Usando parseISO para obter a data correta
      const date = parseISO(schedule.event_date);
      const monthYear = format(date, "MMMM yyyy", { locale: ptBR });

      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(schedule);
    });

    return groups;
  }, [filteredSchedules]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border/50 shadow-xl">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar escalas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
            />
          </div>

          <Select value={filterMinistry} onValueChange={setFilterMinistry}>
            <SelectTrigger className="md:w-[200px] bg-background/50">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar ministério" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os ministérios</SelectItem>
              {ministries?.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as "date" | "ministry")}>
            <SelectTrigger className="md:w-[180px] bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Ordenar por data</SelectItem>
              <SelectItem value="ministry">Ordenar por ministério</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4" />
          <span>{filteredSchedules.length} escala{filteredSchedules.length !== 1 ? 's' : ''} encontrada{filteredSchedules.length !== 1 ? 's' : ''}</span>
        </div>
      </Card>

      {/* Schedule List */}
      <div className="space-y-6">
        {Object.entries(groupedSchedules).map(([monthYear, monthSchedules]) => (
          <div key={monthYear}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground/80 uppercase tracking-wide">
              <div className="h-1 w-8 bg-gradient-to-r from-primary to-primary/20 rounded-full" />
              {monthYear}
            </h3>

            <div className="grid gap-3">
              {monthSchedules.map((schedule) => {
                // Usando parseISO para obter a data correta
                const date = parseISO(schedule.event_date);
                const dayName = format(date, "EEEE", { locale: ptBR });
                const dayNum = date.getDate();
                const isToday = new Date().toDateString() === date.toDateString();

                return (
                  <Card
                    key={schedule.id}
                    className={cn(
                      "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border cursor-pointer",
                      isToday
                        ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30 ring-2 ring-primary/20"
                        : "bg-gradient-to-r from-card to-card/50 hover:from-accent/20 hover:to-accent/5 border-border/50"
                    )}
                    onClick={() => onSelectSchedule(schedule)}
                  >
                    {/* Decorative gradient line */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative p-5 flex items-center gap-4">
                      {/* Date Badge */}
                      <div className={cn(
                        "flex flex-col items-center justify-center w-16 h-16 rounded-xl font-bold shrink-0 shadow-md",
                        isToday
                          ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                          : "bg-gradient-to-br from-accent to-accent/80 text-accent-foreground"
                      )}>
                        <span className="text-2xl leading-none">{dayNum}</span>
                        <span className="text-[10px] uppercase mt-0.5">
                          {format(date, "MMM", { locale: ptBR })}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors truncate">
                              {schedule.event_type} - {schedule.ministries?.name || "Ministério"}
                            </h4>
                            <p className="text-sm text-muted-foreground capitalize">
                              {dayName}
                            </p>
                          </div>

                          {isToday && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30 animate-pulse">
                              Hoje
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {schedule.event_time.substring(0, 5)}
                          </span>

                          {schedule.observations && (
                            <span className="flex items-center gap-1.5 max-w-xs truncate">
                              <MapPin className="w-4 h-4 shrink-0" />
                              {schedule.observations}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSchedule(schedule);
                        }}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {filteredSchedules.length === 0 && (
          <Card className="p-12 text-center border-dashed">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <Search className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <p className="text-lg font-medium mb-2">Nenhuma escala encontrada</p>
            <p className="text-sm text-muted-foreground">
              Tente ajustar os filtros ou criar uma nova escala
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

// Enhanced Edit Sheet Component
const EditScheduleSheet = ({
  schedule,
  isOpen,
  onClose,
  churchId,
  isBlocked
}: {
  schedule: ScheduleWithMinistry | null;
  isOpen: boolean;
  onClose: () => void;
  churchId: string;
  isBlocked: boolean;
}) => {
  const updateScheduleMutation = useUpdateSchedule();
  const assignMembersMutation = useAssignMembersToSchedule();
  const deleteScheduleMutation = useDeleteSchedule();
  const { data: ministries } = useMinistries(churchId);
  const { data: allMembers } = useMembers(churchId); // Todos os membros

  const { data: assignments, isLoading: isLoadingAssignments } = useScheduleAssignments(schedule?.id || null);

  const [formData, setFormData] = useState({
    ministry_id: schedule?.ministry_id || "",
    event_type: (schedule?.event_type || EVENT_TYPES[0]) as Enums<'event_type'>, // NOVO CAMPO
    event_date: schedule?.event_date || "",
    event_time: schedule?.event_time.substring(0, 5) || "", // Formatando para HH:MM
    observations: schedule?.observations || "",
    selectedMemberIds: [] as string[],
  });

  const [selectedFunction, setSelectedFunction] = useState("all"); // NOVO ESTADO PARA FILTRO DE FUNÇÃO

  useEffect(() => {
    if (schedule) {
      const initialMemberIds = assignments?.map(a => a.member_id) || [];

      setFormData({
        ministry_id: schedule.ministry_id,
        event_type: (schedule.event_type || EVENT_TYPES[0]) as Enums<'event_type'>, // NOVO CAMPO
        event_date: schedule.event_date,
        event_time: schedule.event_time.substring(0, 5), // Formatando para HH:MM
        observations: schedule.observations || "",
        selectedMemberIds: initialMemberIds,
      });
      setSelectedFunction("all"); // Resetar filtro ao abrir
    }
  }, [schedule, assignments]);

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

  // Membros filtrados APENAS pela função selecionada (inclui todos os ministérios)
  const filteredMembers = useMemo(() => {
    if (!allMembers) return [];

    let members = allMembers;

    if (selectedFunction !== "all") {
      members = members.filter(m => m.function === selectedFunction);
    }

    // Ordena os membros selecionados primeiro, depois por nome
    return members.sort((a, b) => {
      const aSelected = formData.selectedMemberIds.includes(a.id);
      const bSelected = formData.selectedMemberIds.includes(b.id);

      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;

      return a.name.localeCompare(b.name);
    });
  }, [allMembers, selectedFunction, formData.selectedMemberIds]);

  const allMemberIds = filteredMembers.map(m => m.id);
  const { data: conflicts, isLoading: isLoadingConflicts } = useScheduleConflict(
    allMemberIds,
    formData.event_date,
    formData.event_time,
    schedule?.id || null
  );

  const handleSelectMember = (memberId: string) => {
    if (isBlocked) {
      toast.error("Acesso bloqueado. Faça um upgrade para editar escalas.");
      return;
    }
    setFormData(prev => {
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
      toast.error("Acesso bloqueado. Faça um upgrade para editar escalas.");
      return;
    }
    const currentSelected = new Set(formData.selectedMemberIds);
    const membersToAdd = filteredMembers.filter(m => !currentSelected.has(m.id)).map(m => m.id);

    setFormData(prev => ({
      ...prev,
      selectedMemberIds: [...prev.selectedMemberIds, ...membersToAdd]
    }));
  };

  // Função para desmarcar todos os membros filtrados
  const handleDeselectAllFiltered = () => {
    if (isBlocked) {
      toast.error("Acesso bloqueado. Faça um upgrade para editar escalas.");
      return;
    }
    const membersToRemove = new Set(filteredMembers.map(m => m.id));

    setFormData(prev => ({
      ...prev,
      selectedMemberIds: prev.selectedMemberIds.filter(id => !membersToRemove.has(id))
    }));
  };

  const handleSave = async () => {
    if (isBlocked) {
      toast.error("Acesso bloqueado. Faça um upgrade para salvar alterações.");
      return;
    }
    if (!schedule) return;

    if (!formData.ministry_id || !formData.event_date || !formData.event_time) {
      toast.error("Por favor, preencha o Ministério, Data e Horário.");
      return;
    }

    const membersWithConflicts = formData.selectedMemberIds.filter(id => {
      const conflict = conflicts?.[id];
      return conflict?.isUnavailable || conflict?.isConflicting;
    });

    if (membersWithConflicts.length > 0) {
      const conflictNames = membersWithConflicts.map(id => allMembers?.find(m => m.id === id)?.name).join(', ');
      toast.error(`Conflito detectado! Os seguintes membros estão indisponíveis ou escalados em outro lugar: ${conflictNames}.`);
      // Não bloqueamos, apenas avisamos.
    }

    const ministryName = ministries?.find(m => m.id === formData.ministry_id)?.name || "Serviço";

    const updates: TablesUpdate<'schedules'> = {
      ministry_id: formData.ministry_id,
      event_type: formData.event_type, // NOVO CAMPO
      event_date: formData.event_date,
      event_time: formData.event_time, // Já está em HH:MM
      observations: formData.observations,
      title: `${formData.event_type} de ${ministryName} em ${format(parseISO(formData.event_date), 'dd/MM')}`, // Título atualizado
    };

    try {
      await updateScheduleMutation.mutateAsync({ id: schedule.id, updates });

      // 1. Obter atribuições existentes para manter os tokens
      const { data: existingAssignments } = await supabase
        .from('schedule_assignments')
        .select('member_id, response_token')
        .eq('schedule_id', schedule.id);

      const existingTokens = new Map(existingAssignments?.map(a => [a.member_id, a.response_token]) || []);

      // 2. Preparar novas atribuições, gerando token se necessário
      const assignmentsToInsert: TablesInsert<'schedule_assignments'>[] = formData.selectedMemberIds.map(memberId => {
        const existingToken = existingTokens.get(memberId);

        // Gera um novo token se não houver um existente
        const response_token = existingToken || crypto.randomUUID();

        return {
          schedule_id: schedule.id,
          member_id: memberId,
          response_token: response_token,
        };
      });

      // 3. Deletar e Inserir (ou usar uma função upsert mais complexa, mas delete/insert é mais simples aqui)

      // 1. Delete existing assignments for this schedule
      const { error: deleteError } = await supabase
        .from('schedule_assignments')
        .delete()
        .eq('schedule_id', schedule.id);

      if (deleteError) throw deleteError;

      // 2. Insert new assignments
      if (assignmentsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('schedule_assignments')
          .insert(assignmentsToInsert);

        if (insertError) throw insertError;
      }

      // Invalida o cache manualmente, pois não estamos usando o hook de mutação de atribuição
      assignMembersMutation.onSuccess();

      onClose();
    } catch (error) {
      // Handled by mutation hooks
    }
  };

  const handleDelete = async () => {
    if (isBlocked) {
      toast.error("Acesso bloqueado. Faça um upgrade para excluir escalas.");
      return;
    }
    if (!schedule) return;
    try {
      await deleteScheduleMutation.mutateAsync(schedule.id);
      onClose();
    } catch (error) {
      // Handled by mutation hook
    }
  };

  const isSaving = updateScheduleMutation.isPending || assignMembersMutation.isPending;
  const isDeleting = deleteScheduleMutation.isPending;
  const isLoadingData = isLoadingAssignments || isLoadingConflicts;
  const isActionDisabled = isSaving || isDeleting || isBlocked;

  if (!schedule) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="sm:max-w-lg w-full flex flex-col bg-gradient-to-br from-background to-background/95">
        <SheetHeader className="pb-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Edit className="w-5 h-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">Editar Escala</SheetTitle>
              <SheetDescription>
                Ajuste os detalhes e membros escalados
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {isLoadingData ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mt-4">Carregando dados da escala...</p>
          </div>
        ) : (
          <div className="py-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
            {/* Tipo de Culto */}
            <div className="space-y-2">
              <Label htmlFor="event_type" className="text-sm font-medium">Tipo de Culto/Evento *</Label>
              <Select
                onValueChange={(value) => setFormData({ ...formData, event_type: value as Enums<'event_type'> })}
                value={formData.event_type}
                disabled={isActionDisabled}
              >
                <SelectTrigger id="event_type">
                  <SelectValue placeholder="Selecione o tipo de evento" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ministry and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ministry_id" className="text-sm font-medium">Ministério Principal *</Label>
                <Select
                  onValueChange={(value) => {
                    // Ao mudar o ministério principal, mantemos a seleção de membros, mas avisamos
                    setFormData({ ...formData, ministry_id: value });
                    setSelectedFunction("all"); // Resetar filtro de função ao mudar ministério
                  }}
                  value={formData.ministry_id}
                  disabled={isActionDisabled}
                >
                  <SelectTrigger id="ministry_id" className="bg-background/50">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ministries?.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event_date" className="text-sm font-medium">Data *</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  disabled={isActionDisabled}
                  className="bg-background/50"
                />
              </div>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label htmlFor="event_time" className="text-sm font-medium">Horário *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="event_time"
                  type="time"
                  value={formData.event_time}
                  onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                  disabled={isActionDisabled}
                  className="pl-10 bg-background/50"
                />
              </div>
            </div>

            {/* Members */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Membros Escalados</Label>
                <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded-full">
                  {formData.selectedMemberIds.length} selecionado{formData.selectedMemberIds.length !== 1 ? 's' : ''}
                </span>
              </div>

              <Card className="p-4 bg-gradient-to-br from-muted/30 to-muted/10 border-border/50">
                {allMembers?.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    <p>Nenhum membro cadastrado na igreja.</p>
                    <Link to="/membros" className="text-primary text-sm hover:underline mt-2 block">
                      Cadastrar membros
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Filtro de Função */}
                    {uniqueFunctions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-3">
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
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                      {filteredMembers.map((member) => {
                        const conflict = conflicts?.[member.id];
                        const isSelected = formData.selectedMemberIds.includes(member.id);
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
                        Membros marcados em vermelho estão indisponíveis ou em conflito.
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* Observations */}
            <div className="space-y-2">
              <Label htmlFor="observations" className="text-sm font-medium">Observações</Label>
              <Textarea
                id="observations"
                placeholder="Tema do culto, vestimenta especial, local..."
                rows={4}
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                disabled={isActionDisabled}
                className="bg-background/50 resize-none"
              />
            </div>

            {isBlocked && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive text-sm flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Acesso bloqueado. Faça um upgrade para editar escalas.
              </div>
            )}
          </div>
        )}

        <div className="p-4 border-t bg-card/50 backdrop-blur-sm flex-shrink-0 flex flex-col gap-3">
          {/* Share Button */}
          {schedule?.id && schedule.title && (
            <ShareScheduleButton
              scheduleId={schedule.id}
              scheduleTitle={schedule.title}
            />
          )}

          <div className="flex justify-between gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isActionDisabled || isLoadingData}>
                  {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash className="w-4 h-4 mr-2" />}
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente a escala de{" "}
                    <span className="font-semibold">{format(parseISO(schedule?.event_date || new Date().toISOString().split('T')[0]), 'dd/MM/yyyy', { locale: ptBR })}</span>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Excluir Escala
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button onClick={handleSave} className="flex-1" disabled={isActionDisabled || isLoadingData}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Main Component
const Escalas = () => {
  const { churchId, isLoading: isLoadingChurch, isBlocked } = useChurch();
  const { data: schedules, isLoading: isLoadingSchedules } = useAllFutureSchedules(churchId);
  const { data: ministries } = useMinistries(churchId);

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleWithMinistry | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

  if (isLoadingChurch) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!churchId) {
    return <Navigate to="/setup" replace />;
  }

  const handleSelectSchedule = (schedule: ScheduleWithMinistry) => {
    setSelectedSchedule(schedule);
    setIsEditSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsEditSheetOpen(false);
    setSelectedSchedule(null);
  };

  const futureSchedules = schedules || [];
  // A contagem de escalas realizadas e próximas deve ser baseada na data atual
  const today = format(new Date(), 'yyyy-MM-dd');
  // Removendo a lógica de completedSchedules, pois não vamos mais exibi-la
  const upcomingSchedules = futureSchedules.filter(s => s.event_date >= today).length;


  return (
    <DashboardLayout
      title="Escalas Ministeriais"
      description="Visualize e gerencie todas as escalas"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className={cn(
                "transition-all duration-200",
                viewMode === 'calendar' && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              onClick={() => setViewMode('calendar')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendário
            </Button>
            <Button
              variant="outline"
              className={cn(
                "transition-all duration-200",
                viewMode === 'list' && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4 mr-2" />
              Lista
            </Button>
          </div>

          <Link to="/escalas/nova">
            <Button
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
              disabled={isBlocked}
            >
              {isBlocked ? <Lock className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Nova Escala
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        {isLoadingSchedules ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-4 h-24 animate-pulse bg-muted/50" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-violet-500/20">
                  <Calendar className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{futureSchedules.length}</p>
                  <p className="text-xs text-muted-foreground">Total de Escalas</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{ministries?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Ministérios Ativos</p>
                </div>
              </div>
            </Card>

            {/* Card de Próximas Escalas (Ajustado para ser o terceiro card) */}
            <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/20">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{upcomingSchedules}</p>
                  <p className="text-xs text-muted-foreground">Próximas</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* View Content */}
        {isLoadingSchedules ? (
          <Card className="p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando escalas...</p>
          </Card>
        ) : futureSchedules.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <Calendar className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <p className="text-lg font-medium mb-2">Nenhuma escala cadastrada</p>
            <p className="text-sm text-muted-foreground mb-6">
              Comece criando sua primeira escala ministerial
            </p>
            <Link to="/escalas/nova">
              <Button className="bg-gradient-to-r from-primary to-primary/80" disabled={isBlocked}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Escala
              </Button>
            </Link>
          </Card>
        ) : viewMode === 'calendar' ? (
          <PremiumCalendar schedules={futureSchedules} onSelectSchedule={handleSelectSchedule} />
        ) : (
          <PremiumListView
            schedules={futureSchedules}
            onSelectSchedule={handleSelectSchedule}
            ministries={ministries || []}
          />
        )}

        {/* Edit Sheet */}
        <EditScheduleSheet
          schedule={selectedSchedule}
          isOpen={isEditSheetOpen}
          onClose={handleCloseSheet}
          churchId={churchId}
          isBlocked={isBlocked} // Passando a propriedade de bloqueio
        />
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--primary) / 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.5);
        }
      `}</style>
    </DashboardLayout>
  );
};

export default Escalas;
