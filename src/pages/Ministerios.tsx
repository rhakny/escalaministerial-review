import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { List, Plus, Loader2, Users, Edit, Trash2, X, Sparkles, Search, TrendingUp, Lock } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useChurch } from "@/hooks/useChurch";
import { useMinistries, useCreateMinistry, useUpdateMinistry, useDeleteMinistry } from "@/hooks/useMinistryData";
import { useMembers } from "@/hooks/useMemberData";
import { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import DashboardLayout from "@/components/DashboardLayout";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Ministry {
  id: string;
  name: string;
  description?: string | null;
  church_id: string;
}

const Ministerios = () => {
  const { churchId, isLoading: isLoadingChurch, isBlocked } = useChurch();
  const { data: ministries, isLoading: isLoadingMinistries } = useMinistries(churchId);
  const { data: members } = useMembers(churchId);
  const createMinistryMutation = useCreateMinistry();
  const updateMinistryMutation = useUpdateMinistry();
  const deleteMinistryMutation = useDeleteMinistry();

  const [showForm, setShowForm] = useState(false);
  const [editingMinistry, setEditingMinistry] = useState<Ministry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });

  if (isLoadingChurch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando ministérios...</p>
        </div>
      </div>
    );
  }

  if (!churchId) {
    return <Navigate to="/setup" replace />;
  }

  const handleAddMinisterio = async () => {
    if (isBlocked) {
      toast.error("Acesso bloqueado. Faça um upgrade para adicionar ministérios.");
      return;
    }
    if (!formData.name.trim()) {
      return;
    }

    const ministryData: TablesInsert<'ministries'> = {
      name: formData.name,
      church_id: churchId,
      description: formData.description || null,
    };

    await createMinistryMutation.mutateAsync(ministryData);
    
    setFormData({ name: "", description: "" });
    setShowForm(false);
  };

  const handleEditMinistry = async () => {
    if (isBlocked) {
      toast.error("Acesso bloqueado. Faça um upgrade para editar ministérios.");
      return;
    }
    if (!editingMinistry || !formData.name.trim()) {
      return;
    }

    const updates: TablesUpdate<'ministries'> = {
      name: formData.name,
      description: formData.description || null,
    };

    await updateMinistryMutation.mutateAsync({
      id: editingMinistry.id,
      updates
    });

    setFormData({ name: "", description: "" });
    setEditingMinistry(null);
  };

  const handleDeleteMinistry = async (ministryId: string) => {
    if (isBlocked) {
      toast.error("Acesso bloqueado. Faça um upgrade para excluir ministérios.");
      return;
    }
    await deleteMinistryMutation.mutateAsync(ministryId);
  };

  const openEditForm = (ministry: Ministry) => {
    setEditingMinistry(ministry);
    setFormData({
      name: ministry.name,
      description: ministry.description || ""
    });
    setShowForm(false);
  };

  const cancelEdit = () => {
    setEditingMinistry(null);
    setFormData({ name: "", description: "" });
  };

  const openAddForm = () => {
    if (isBlocked) {
      toast.error("Acesso bloqueado. Faça um upgrade para adicionar ministérios.");
      return;
    }
    setShowForm(true);
    setEditingMinistry(null);
    setFormData({ name: "", description: "" });
  };

  const getMemberCount = (ministryId: string) => {
    return members?.filter(m => m.ministry_id === ministryId).length || 0;
  };

  const filteredMinistries = ministries?.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalMembers = members?.length || 0;
  const averageMembersPerMinistry = ministries?.length 
    ? Math.round(totalMembers / ministries.length) 
    : 0;

  const isSaving = createMinistryMutation.isPending || updateMinistryMutation.isPending;
  const isActionDisabled = isSaving || isBlocked;

  return (
    <DashboardLayout
      title="Ministérios"
      description="Gerencie os ministérios da sua igreja"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ministérios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
            />
          </div>
          
          <Button 
            onClick={openAddForm} 
            disabled={isActionDisabled}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
          >
            {isBlocked ? <Lock className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Novo Ministério
          </Button>
        </div>

        {/* Stats Cards */}
        {!isLoadingMinistries && ministries && ministries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-violet-500/20">
                  <List className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{ministries.length}</p>
                  <p className="text-xs text-muted-foreground">Total de Ministérios</p>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalMembers}</p>
                  <p className="text-xs text-muted-foreground">Membros Total</p>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/20">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{averageMembersPerMinistry}</p>
                  <p className="text-xs text-muted-foreground">Média por Ministério</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Add/Edit Form */}
        {(showForm || editingMinistry) && (
          <Card className="overflow-hidden border-border/50 shadow-xl bg-gradient-to-br from-card to-card/50">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    {editingMinistry ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">
                      {editingMinistry ? "Editar Ministério" : "Adicionar Novo Ministério"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {editingMinistry ? "Atualize as informações do ministério" : "Preencha os dados do novo ministério"}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={editingMinistry ? cancelEdit : () => setShowForm(false)}
                  disabled={isActionDisabled}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="nome" className="text-sm font-medium">Nome do Ministério *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Louvor, Recepção, Diaconato..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onKeyPress={(e) => e.key === "Enter" && (editingMinistry ? handleEditMinistry() : handleAddMinisterio())}
                  disabled={isActionDisabled}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Breve descrição sobre o ministério..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isActionDisabled}
                  rows={3}
                  className="mt-2 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={editingMinistry ? handleEditMinistry : handleAddMinisterio} 
                  disabled={isActionDisabled || !formData.name.trim()}
                  className="flex-1"
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingMinistry ? "Atualizar" : "Salvar"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={editingMinistry ? cancelEdit : () => setShowForm(false)} 
                  disabled={isActionDisabled}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Ministries List */}
        {isLoadingMinistries ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6 h-[160px] animate-pulse bg-muted/50" />
            ))}
          </div>
        ) : filteredMinistries.length === 0 && searchTerm ? (
          <Card className="p-12 text-center border-dashed">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <Search className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <p className="text-lg font-medium mb-2">Nenhum ministério encontrado</p>
            <p className="text-sm text-muted-foreground">
              Tente buscar com outros termos
            </p>
          </Card>
        ) : filteredMinistries.length === 0 ? (
          <Card className="p-12 text-center border-dashed bg-gradient-to-br from-card to-card/50">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <List className="w-10 h-10 text-primary/50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum ministério cadastrado</h3>
            <p className="text-muted-foreground mb-6">
              Comece adicionando os ministérios da sua igreja
            </p>
            <Button onClick={openAddForm} className="bg-gradient-to-r from-primary to-primary/80" disabled={isBlocked}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Ministério
            </Button>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Sparkles className="w-4 h-4" />
              <span>{filteredMinistries.length} ministério{filteredMinistries.length !== 1 ? 's' : ''} encontrado{filteredMinistries.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMinistries.map((ministerio) => {
                const memberCount = getMemberCount(ministerio.id);
                const hasMembers = memberCount > 0;

                return (
                  <Card 
                    key={ministerio.id} 
                    className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors truncate">
                            {ministerio.name}
                          </h3>
                          {ministerio.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {ministerio.description}
                            </p>
                          )}
                        </div>
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ml-3",
                          hasMembers 
                            ? "bg-gradient-to-br from-primary/20 to-primary/10" 
                            : "bg-muted/50"
                        )}>
                          <List className={cn("w-6 h-6", hasMembers ? "text-primary" : "text-muted-foreground")} />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-muted/30">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {memberCount} membro{memberCount !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditForm(ministerio)}
                          disabled={isActionDisabled || deleteMinistryMutation.isPending}
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
                              disabled={isActionDisabled || deleteMinistryMutation.isPending || hasMembers}
                              className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O ministério <span className="font-semibold">{ministerio.name}</span> será excluído permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteMinistry(ministerio.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      {hasMembers && (
                        <p className="text-xs text-muted-foreground mt-3 text-center">
                          Remova os membros antes de excluir
                        </p>
                      )}
                      {isBlocked && (
                        <p className="text-xs text-destructive mt-3 text-center flex items-center justify-center gap-1">
                          <Lock className="w-3 h-3" />
                          Acesso Bloqueado
                        </p>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Ministerios;
