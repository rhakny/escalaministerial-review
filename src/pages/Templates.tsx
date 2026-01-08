import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Plus, Loader2, List, Clock, Edit, Trash2, X, Users, AlertTriangle, Check, Crown, Lock } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useChurch } from "@/hooks/useChurch";
import { Tables, TablesInsert, TablesUpdate, Enums } from "@/integrations/supabase/types";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

type ScheduleTemplate = Tables<'schedule_templates'>;
type TemplateFunction = Tables<'template_functions'>;

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

// --- HOOKS DE DADOS ---

export const useTemplates = (churchId: string | null) => {
  return useQuery<ScheduleTemplate[]>({
    queryKey: ["scheduleTemplates", churchId],
    queryFn: async () => {
      if (!churchId) return [];
      const { data, error } = await supabase
        .from('schedule_templates')
        .select('*')
        .eq('church_id', churchId)
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!churchId,
  });
};

export const useTemplateFunctions = (templateId: string | null) => {
  return useQuery<TemplateFunction[]>({
    queryKey: ["templateFunctions", templateId],
    queryFn: async () => {
      if (!templateId) return [];
      const { data, error } = await supabase
        .from('template_functions')
        .select('*')
        .eq('template_id', templateId)
        .order('function_name', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!templateId,
  });
};

const useManageTemplate = () => {
  const queryClient = useQueryClient();

  // O tipo 'functions' agora é TablesInsert para garantir que apenas os campos necessários sejam enviados
  return useMutation({
    mutationFn: async ({ template, functions }: {
      template: TablesInsert<'schedule_templates'> | TablesUpdate<'schedule_templates'> & { id: string },
      functions: TablesInsert<'template_functions'>[]
    }) => {
      let templateId: string;

      if ('id' in template) {
        // Update
        const { data, error } = await supabase
          .from('schedule_templates')
          .update(template)
          .eq('id', template.id)
          .select('id')
          .single();
        if (error) throw error;
        templateId = data.id;

        // Delete existing functions
        await supabase.from('template_functions').delete().eq('template_id', templateId);

      } else {
        // Insert
        const { data, error } = await supabase
          .from('schedule_templates')
          .insert(template)
          .select('id')
          .single();
        if (error) throw error;
        templateId = data.id;
      }

      // Insert new functions
      if (functions.length > 0) {
        // Adiciona o template_id correto a cada função antes de inserir
        const functionsToInsert: TablesInsert<'template_functions'>[] = functions.map(f => ({
          ...f,
          template_id: templateId,
        }));

        const { error: funcError } = await supabase.from('template_functions').insert(functionsToInsert);
        if (funcError) throw funcError;
      }

      return templateId;
    },
    onSuccess: () => {
      toast.success("Template salvo com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["scheduleTemplates"] });
      queryClient.invalidateQueries({ queryKey: ["templateFunctions"] });
    },
    onError: (error) => {
      console.error("Template Save Error:", error);
      toast.error("Erro ao salvar o template.");
    },
  });
};

const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      // Deletar funções em cascata (configurado no DB)
      const { error } = await supabase
        .from('schedule_templates')
        .delete()
        .eq('id', templateId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Template excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["scheduleTemplates"] });
    },
    onError: (error) => {
      console.error("Template Deletion Error:", error);
      toast.error("Erro ao excluir template.");
    },
  });
};

// --- COMPONENTE SHEET DE EDIÇÃO ---

interface TemplateSheetProps {
  initialTemplate: ScheduleTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  churchId: string;
  isBlocked: boolean;
}

// Definindo o tipo local para rastreamento no frontend
// Usamos 'id' para o ID do DB (se existir) e 'temp_id' para o rastreamento no React
type LocalTemplateFunction = Omit<TemplateFunction, 'template_id' | 'created_at' | 'id'> & { temp_id: string, id?: string };

const TemplateSheet = ({ initialTemplate, isOpen, onClose, churchId, isBlocked }: TemplateSheetProps) => {
  const isEditing = !!initialTemplate;
  const manageMutation = useManageTemplate();
  const { data: initialFunctions = [], isLoading: isLoadingFunctions } = useTemplateFunctions(initialTemplate?.id || null);

  const [templateData, setTemplateData] = useState<Omit<TablesInsert<'schedule_templates'>, 'church_id'> & { id?: string }>({
    id: initialTemplate?.id,
    name: initialTemplate?.name || "",
    event_type: initialTemplate?.event_type || EVENT_TYPES[0],
    event_time: initialTemplate?.event_time || "19:00",
    observations: initialTemplate?.observations || "",
  });

  const [functions, setFunctions] = useState<LocalTemplateFunction[]>([]);

  const [newFunctionName, setNewFunctionName] = useState("");
  const [newFunctionCount, setNewFunctionCount] = useState(1);
  const [isNewFunctionLeader, setIsNewFunctionLeader] = useState(false);

  // 1. Sincroniza Template Data (apenas quando initialTemplate muda)
  useEffect(() => {
    if (initialTemplate) {
      setTemplateData({
        id: initialTemplate.id,
        name: initialTemplate.name,
        event_type: initialTemplate.event_type,
        event_time: initialTemplate.event_time.substring(0, 5),
        observations: initialTemplate.observations || "",
      });
    } else {
      setTemplateData({
        name: "",
        event_type: EVENT_TYPES[0],
        event_time: "19:00",
        observations: "",
      });
    }
  }, [initialTemplate]);

  // 2. Sincroniza Funções (quando initialTemplate muda OU quando as funções terminam de carregar)
  useEffect(() => {
    if (initialTemplate && !isLoadingFunctions) {
      // Mapeia as funções do DB para o formato local, usando o ID do DB como temp_id
      setFunctions(initialFunctions.map(f => ({
        temp_id: f.id, // ID do DB para rastreamento
        id: f.id, // Mantemos o ID do DB para referência
        function_name: f.function_name,
        required_count: f.required_count,
        is_leader: f.is_leader,
      })));
    } else if (!initialTemplate) {
      setFunctions([]);
    }
  }, [initialTemplate, initialFunctions, isLoadingFunctions]);

  const handleAddFunction = () => {
    if (!newFunctionName.trim() || newFunctionCount < 1) return;

    const newFunc: LocalTemplateFunction = {
      temp_id: crypto.randomUUID(), // ID temporário para o frontend
      function_name: newFunctionName.trim(),
      required_count: newFunctionCount,
      is_leader: isNewFunctionLeader,
    };

    setFunctions(prev => {
      const newState = [...prev, newFunc];
      console.log("✅ Função adicionada. Novo estado de funções:", newState);
      return newState;
    });
    setNewFunctionName("");
    setNewFunctionCount(1);
    setIsNewFunctionLeader(false);
  };

  const handleRemoveFunction = (tempId: string) => {
    setFunctions(prev => prev.filter(f => f.temp_id !== tempId));
  };

  const handleUpdateFunctionCount = (tempId: string, count: number) => {
    setFunctions(prev => prev.map(f => f.temp_id === tempId ? { ...f, required_count: count } : f));
  };

  const handleToggleLeader = (tempId: string, checked: boolean) => {
    setFunctions(prev => prev.map(f => f.temp_id === tempId ? { ...f, is_leader: checked } : f));
  };

  const handleSave = async () => {
    if (isBlocked) {
      toast.error("Acesso bloqueado. Faça um upgrade para gerenciar templates.");
      return;
    }
    if (!templateData.name.trim()) {
      toast.error("O nome do template é obrigatório.");
      return;
    }

    const templateToSave: TablesInsert<'schedule_templates'> | TablesUpdate<'schedule_templates'> & { id: string } = isEditing
      ? { ...templateData, id: initialTemplate!.id }
      : { ...templateData, church_id: churchId };

    // Mapeia o estado local para o tipo de inserção do Supabase, removendo campos temporários
    const functionsToSave: TablesInsert<'template_functions'>[] = functions.map(f => ({
      function_name: f.function_name,
      required_count: f.required_count,
      is_leader: f.is_leader,
      template_id: templateData.id || "", // Adiciona template_id (será sobreposto na mutação se for novo)
    }));

    try {
      await manageMutation.mutateAsync({ template: templateToSave, functions: functionsToSave });
      onClose();
    } catch (error) {
      // Handled by mutation hook
    }
  };

  const isSaving = manageMutation.isPending;
  const isActionDisabled = isSaving || isBlocked;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="sm:max-w-lg w-full flex flex-col bg-gradient-to-br from-background to-background/95">
        <SheetHeader className="pb-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <List className="w-5 h-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">{isEditing ? "Editar Template" : "Novo Template de Escala"}</SheetTitle>
              <SheetDescription>
                Defina as funções e horários padrão para este tipo de evento.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {isLoadingFunctions && isEditing ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Carregando funções...</p>
          </div>
        ) : (
          <div className="py-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
            {/* Informações Básicas */}
            <Card className="p-4 space-y-4 bg-muted/30 border-border/50">
              <h3 className="font-semibold text-lg">Detalhes do Template</h3>
              <div>
                <Label htmlFor="name">Nome do Template *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Escola Sabatina - Louvor"
                  value={templateData.name}
                  onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
                  disabled={isActionDisabled}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="event_type">Tipo de Evento *</Label>
                  <Select
                    onValueChange={(value) => setTemplateData({ ...templateData, event_type: value as Enums<'event_type'> })}
                    value={templateData.event_type}
                    disabled={isActionDisabled}
                  >
                    <SelectTrigger id="event_type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent position="popper" side="bottom" align="start" sideOffset={4}>
                      {EVENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="event_time">Horário Padrão *</Label>
                  <Input
                    id="event_time"
                    type="time"
                    value={templateData.event_time}
                    onChange={(e) => setTemplateData({ ...templateData, event_time: e.target.value })}
                    disabled={isActionDisabled}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="observations">Observações Padrão</Label>
                <Input
                  id="observations"
                  placeholder="Ex: Vestimenta social, chegar 30 min antes"
                  value={templateData.observations || ""}
                  onChange={(e) => setTemplateData({ ...templateData, observations: e.target.value })}
                  disabled={isActionDisabled}
                />
              </div>
            </Card>

            {/* Funções Necessárias */}
            <Card className="p-4 space-y-4 border-border/50">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Funções Necessárias
              </h3>
              <p className="text-sm text-muted-foreground">Defina quantas pessoas são necessárias para cada função neste template.</p>

              {/* Lista de Funções */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {functions.map((func) => (
                  <div key={func.temp_id} className="flex items-center gap-3 p-2 border rounded-lg bg-card">
                    <div className="flex-1 font-medium flex items-center gap-2">
                      {func.function_name}
                      {func.is_leader && <Crown className="w-4 h-4 text-amber-500" />}
                    </div>

                    <div className="flex items-center gap-2">
                      <Label htmlFor={`leader-${func.temp_id}`} className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer">
                        <Crown className="w-3 h-3 text-amber-500" /> Líder
                      </Label>
                      <Checkbox
                        id={`leader-${func.temp_id}`}
                        checked={func.is_leader}
                        onCheckedChange={(checked) => handleToggleLeader(func.temp_id, !!checked)}
                        disabled={isActionDisabled}
                      />
                    </div>

                    <Input
                      type="number"
                      min="1"
                      value={func.required_count}
                      onChange={(e) => handleUpdateFunctionCount(func.temp_id, parseInt(e.target.value) || 1)}
                      disabled={isActionDisabled}
                      className="w-20 text-center"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFunction(func.temp_id)}
                      disabled={isActionDisabled}
                    >
                      <X className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Adicionar Nova Função */}
              <div className="pt-4 border-t border-border/50 space-y-3">
                <h4 className="font-medium text-sm">Adicionar Nova Função</h4>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    placeholder="Nome da Função"
                    value={newFunctionName}
                    onChange={(e) => setNewFunctionName(e.target.value)}
                    disabled={isActionDisabled}
                    className="col-span-3 sm:col-span-1"
                  />
                  <Input
                    type="number"
                    min="1"
                    value={newFunctionCount}
                    onChange={(e) => setNewFunctionCount(parseInt(e.target.value) || 1)}
                    disabled={isActionDisabled}
                    className="col-span-3 sm:col-span-1"
                  />
                  <div className="flex items-center space-x-2 col-span-3 sm:col-span-1">
                    <Checkbox
                      id="isLeader"
                      checked={isNewFunctionLeader}
                      onCheckedChange={(checked) => setIsNewFunctionLeader(!!checked)}
                      disabled={isActionDisabled}
                    />
                    <Label htmlFor="isLeader" className="text-sm font-medium flex items-center gap-1">
                      <Crown className="w-4 h-4 text-amber-500" />
                      Líder
                    </Label>
                  </div>
                </div>
                <Button
                  onClick={handleAddFunction}
                  disabled={isActionDisabled || !newFunctionName.trim() || newFunctionCount < 1}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </Card>

            {isBlocked && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive text-sm flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Acesso bloqueado. Faça um upgrade para gerenciar templates.
              </div >
            )}
          </div>
        )}

        <div className="p-4 border-t bg-card/50 backdrop-blur-sm flex-shrink-0">
          <Button onClick={handleSave} className="w-full" disabled={isActionDisabled || isLoadingFunctions}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? "Salvar Alterações" : "Criar Template"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// --- COMPONENTE PRINCIPAL ---

const TemplatesPage = () => {
  const { churchId, isLoading: isLoadingChurch, isBlocked } = useChurch();
  const { data: templates, isLoading: isLoadingTemplates } = useTemplates(churchId);
  const deleteMutation = useDeleteTemplate();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ScheduleTemplate | null>(null);

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

  const handleOpenCreate = () => {
    if (isBlocked) {
      toast.error("Acesso bloqueado. Faça um upgrade para criar templates.");
      return;
    }
    setSelectedTemplate(null);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (template: ScheduleTemplate) => {
    if (isBlocked) {
      toast.error("Acesso bloqueado. Faça um upgrade para editar templates.");
      return;
    }
    setSelectedTemplate(template);
    setIsSheetOpen(true);
  };

  const handleDelete = async (templateId: string) => {
    if (isBlocked) {
      toast.error("Acesso bloqueado. Faça um upgrade para excluir templates.");
      return;
    }
    await deleteMutation.mutateAsync(templateId);
  };

  return (
    <DashboardLayout
      title="Templates de Escala"
      description="Crie modelos reutilizáveis para eventos recorrentes como Escola Sabatina e Culto Divino."
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-end">
          <Button
            onClick={handleOpenCreate}
            disabled={isBlocked}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
          >
            {isBlocked ? <Lock className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Novo Template
          </Button>
        </div>

        {/* Templates List */}
        {isLoadingTemplates ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-6 h-[140px] animate-pulse bg-muted/50" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <Card className="p-12 text-center border-dashed bg-gradient-to-br from-card to-card/50">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <List className="w-10 h-10 text-primary/50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum template cadastrado</h3>
            <p className="text-muted-foreground mb-6">
              Crie templates para agilizar a montagem das suas escalas.
            </p>
            <Button onClick={handleOpenCreate} className="bg-gradient-to-r from-primary to-primary/80" disabled={isBlocked}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Template
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors truncate">
                        {template.name}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {template.event_type} às {template.event_time.substring(0, 5)}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 ml-3">
                      <List className="w-6 h-6 text-primary" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-muted/30">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Funções definidas (Ver detalhes)
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(template)}
                      disabled={isBlocked || deleteMutation.isPending}
                      className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                    >
                      <Edit className="w-3.5 h-3.5 mr-2" />
                      Editar
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isBlocked || deleteMutation.isPending}
                          className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O template <span className="font-semibold">{template.name}</span> será excluído permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(template.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {isBlocked && (
                    <p className="text-xs text-destructive mt-3 text-center flex items-center justify-center gap-1">
                      <Lock className="w-3 h-3" />
                      Acesso Bloqueado
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <TemplateSheet
        initialTemplate={selectedTemplate}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        churchId={churchId}
        isBlocked={isBlocked}
      />
    </DashboardLayout>
  );
};

export default TemplatesPage;
