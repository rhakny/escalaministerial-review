import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, Mail, Loader2, Edit, X, Search, Sparkles, Filter, UserPlus, Briefcase, TrendingUp, Lock, AlertTriangle, Phone } from "lucide-react";
import { Navigate, Link } from "react-router-dom";
import { useChurch } from "@/hooks/useChurch";
import { useMembers, useCreateMember, MemberWithMinistry } from "@/hooks/useMemberData";
import { useMinistries } from "@/hooks/useMinistryData";
import { TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import MemberSheet from "@/components/MemberSheet";
import { cn } from "@/lib/utils";
import { useMemberLimits } from "@/hooks/useMemberLimits"; // Importando o novo hook

const Membros = () => {
  const { churchId, isLoading: isLoadingChurch, isBlocked: isChurchBlocked } = useChurch();
  const { data: members, isLoading: isLoadingMembers } = useMembers(churchId);
  const { data: ministries, isLoading: isLoadingMinistries } = useMinistries(churchId);
  const createMemberMutation = useCreateMember();
  
  // NOVO: Limites de Membros
  const { 
    memberLimit, 
    currentMemberCount, 
    canAddMember, 
    currentPlanName, 
    isLoading: isLoadingLimits 
  } = useMemberLimits(churchId);

  const [showForm, setShowForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberWithMinistry | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMinistry, setFilterMinistry] = useState<string>("all");

  const [novoMembro, setNovoMembro] = useState({
    name: "",
    function: "",
    ministry_id: "", 
    phone_number: "55", // NOVO: Padrão 55
  });

  const isBlocked = isChurchBlocked || isLoadingLimits;
  const isSaving = createMemberMutation.isPending;
  const isActionDisabled = isSaving || isBlocked || !canAddMember;
  const isLimitReached = !canAddMember && !isBlocked; // Se não está bloqueado pelo plano, mas atingiu o limite

  if (isLoadingChurch || isLoadingLimits) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando membros...</p>
        </div>
      </div>
    );
  }

  if (!churchId) {
    return <Navigate to="/setup" replace />;
  }

  const openAddForm = () => {
    if (isChurchBlocked) {
      toast.error("Acesso bloqueado. Faça um upgrade para adicionar membros.");
      return;
    }
    if (!canAddMember) {
      toast.error(`Limite de membros atingido: Seu plano (${currentPlanName}) permite apenas ${memberLimit} membros.`);
      return;
    }
    setShowForm(true);
    setSelectedMember(null);
    setIsEditSheetOpen(false);
    setNovoMembro({ name: "", function: "", ministry_id: "", phone_number: "55" }); // Reset com 55
  };

  const handleAddMembro = async () => {
    if (isChurchBlocked) {
      toast.error("Acesso bloqueado. Faça um upgrade para adicionar membros.");
      return;
    }
    if (!canAddMember) {
      toast.error(`Limite de membros atingido: Seu plano (${currentPlanName}) permite apenas ${memberLimit} membros.`);
      return;
    }
    
    // Apenas Nome e Ministério são obrigatórios agora
    if (!novoMembro.name || !novoMembro.ministry_id) {
      toast.error("Por favor, preencha o Nome e selecione um Ministério.");
      return;
    }
    
    // Validação básica do telefone (se preenchido, deve ter mais que 55)
    const cleanedPhone = novoMembro.phone_number.replace(/\D/g, '');
    const finalPhoneNumber = cleanedPhone.length > 2 ? cleanedPhone : null;

    const memberData: TablesInsert<'members'> = {
      name: novoMembro.name,
      email: "placeholder@escalaministerial.com.br", // Usando placeholder, pois o campo é NOT NULL no DB
      function: novoMembro.function || "Membro",
      ministry_id: novoMembro.ministry_id,
      church_id: churchId,
      phone_number: finalPhoneNumber, // NOVO CAMPO
    };

    await createMemberMutation.mutateAsync(memberData);
    
    setNovoMembro({ name: "", function: "", ministry_id: "", phone_number: "55" });
    setShowForm(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNovoMembro((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setNovoMembro((prev) => ({ ...prev, ministry_id: value }));
  };

  const handleEditMember = (member: MemberWithMinistry) => {
    if (isChurchBlocked) {
      toast.error("Acesso bloqueado. Faça um upgrade para editar membros.");
      return;
    }
    setSelectedMember(member);
    setIsEditSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsEditSheetOpen(false);
    setSelectedMember(null);
  };

  // Filter members
  const filteredMembers = members?.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.function?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMinistry = filterMinistry === "all" || member.ministry_id === filterMinistry;
    return matchesSearch && matchesMinistry;
  }) || [];

  // Group by ministry
  const membersByMinistry = filteredMembers.reduce((acc, member) => {
    const ministryName = member.ministries?.name || "Sem Ministério";
    if (!acc[ministryName]) {
      acc[ministryName] = [];
    }
    acc[ministryName].push(member);
    return acc;
  }, {} as Record<string, MemberWithMinistry[]>);

  // Stats
  const totalMembers = members?.length || 0;
  const totalMinistries = ministries?.length || 0;
  const averageMembersPerMinistry = totalMinistries > 0 ? Math.round(totalMembers / totalMinistries) : 0;

  return (
    <DashboardLayout
      title="Membros"
      description="Gerencie os membros dos seus ministérios"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col md:flex-row gap-3 flex-1 w-full md:w-auto">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar membros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
              />
            </div>

            <Select value={filterMinistry} onValueChange={setFilterMinistry}>
              <SelectTrigger className="w-full md:w-[200px] bg-background/50">
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
          </div>
          
          <Button 
            onClick={openAddForm} 
            disabled={isActionDisabled}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg w-full md:w-auto"
          >
            {isBlocked ? <Lock className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {isLimitReached ? "Limite Atingido" : "Novo Membro"}
          </Button>
        </div>
        
        {/* Limit Reached Banner */}
        {isLimitReached && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium">
              Limite de membros atingido ({currentMemberCount}/{memberLimit}). Seu plano atual ({currentPlanName}) não permite a adição de mais membros.
              <Link to="/settings" className="text-destructive hover:underline ml-1 font-bold">
                Faça um upgrade.
              </Link>
            </p>
          </div>
        )}

        {/* Stats Cards */}
        {!isLoadingMembers && members && members.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalMembers}</p>
                  <p className="text-xs text-muted-foreground">Total de Membros</p>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-violet-500/20">
                  <Briefcase className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalMinistries}</p>
                  <p className="text-xs text-muted-foreground">Ministérios Ativos</p>
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

        {/* Add Form */}
        {showForm && (
          <Card className="overflow-hidden border-border/50 shadow-xl bg-gradient-to-br from-card to-card/50">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <UserPlus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Adicionar Novo Membro</h3>
                    <p className="text-sm text-muted-foreground">
                      Preencha os dados do novo membro
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowForm(false)}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="name" className="text-sm font-medium">Nome Completo *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Ex: João Silva"
                    value={novoMembro.name}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    className="mt-2"
                  />
                </div>
                
                {/* NOVO CAMPO: Telefone */}
                <div className="md:col-span-2">
                  <Label htmlFor="phone_number" className="text-sm font-medium">Telefone (WhatsApp, Ex: 5511987654321)</Label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone_number"
                      name="phone_number"
                      type="tel"
                      placeholder="55 (DDD) Número"
                      value={novoMembro.phone_number}
                      onChange={handleInputChange}
                      disabled={isSaving}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Inclua o código do país (55) e o DDD.</p>
                </div>
                
                <div>
                  <Label htmlFor="function" className="text-sm font-medium">Função</Label>
                  <Input
                    id="function"
                    name="function"
                    placeholder="Ex: Vocalista, Recepcionista..."
                    value={novoMembro.function}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="ministry_id" className="text-sm font-medium">Ministério *</Label>
                  <Select 
                    onValueChange={handleSelectChange} 
                    value={novoMembro.ministry_id}
                    disabled={isSaving || isLoadingMinistries || (ministries?.length === 0)}
                  >
                    <SelectTrigger id="ministry_id" className="mt-2">
                      <SelectValue placeholder={isLoadingMinistries ? "Carregando..." : "Selecione um ministério"} />
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
              </div>
              <div className="flex gap-2 mt-6">
                <Button onClick={handleAddMembro} disabled={isSaving} className="flex-1">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)} disabled={isSaving}>
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Members List */}
        {isLoadingMembers ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6 h-[140px] animate-pulse bg-muted/50" />
            ))}
          </div>
        ) : filteredMembers.length === 0 && searchTerm ? (
          <Card className="p-12 text-center border-dashed">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <Search className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <p className="text-lg font-medium mb-2">Nenhum membro encontrado</p>
            <p className="text-sm text-muted-foreground">
              Tente buscar com outros termos
            </p>
          </Card>
        ) : filteredMembers.length === 0 ? (
          <Card className="p-12 text-center border-dashed bg-gradient-to-br from-card to-card/50">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Users className="w-10 h-10 text-primary/50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum membro cadastrado</h3>
            <p className="text-muted-foreground mb-6">
              Comece adicionando os membros dos seus ministérios
            </p>
            <Button onClick={openAddForm} className="bg-gradient-to-r from-primary to-primary/80" disabled={isBlocked || isLimitReached}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Membro
            </Button>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Sparkles className="w-4 h-4" />
              <span>{filteredMembers.length} membro{filteredMembers.length !== 1 ? 's' : ''} encontrado{filteredMembers.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Grouped by Ministry */}
            <div className="space-y-6">
              {Object.entries(membersByMinistry).map(([ministryName, ministryMembers]) => (
                <div key={ministryName}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-1 w-8 bg-gradient-to-r from-primary to-primary/20 rounded-full" />
                    <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-wide">
                      {ministryName}
                    </h3>
                    <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                      {ministryMembers.length}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {ministryMembers.map((membro) => (
                      <Card 
                        key={membro.id} 
                        className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/50"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="relative p-5 flex items-center gap-4">
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-lg flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
                            {membro.name.charAt(0).toUpperCase()}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold mb-1 group-hover:text-primary transition-colors truncate">
                              {membro.name}
                            </h3>
                            {/* E-mail removido da exibição */}
                            {membro.function && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Briefcase className="w-3 h-3 shrink-0" />
                                <span className="truncate">{membro.function}</span>
                              </div>
                            )}
                            {membro.phone_number && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                <Phone className="w-3 h-3 shrink-0" />
                                <span className="truncate">{membro.phone_number}</span>
                              </div>
                            )}
                            {membro.ministries?.name && (
                              <span className="inline-block mt-2 px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-semibold rounded-full border border-primary/20">
                                {membro.ministries.name}
                              </span>
                            )}
                          </div>

                          {/* Action Button */}
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleEditMember(membro)}
                            disabled={isChurchBlocked}
                            className="shrink-0 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Edit Member Sheet */}
        <MemberSheet 
          member={selectedMember}
          isOpen={isEditSheetOpen}
          onClose={handleCloseSheet}
          churchId={churchId}
          // isBlocked é passado para desabilitar ações internas
          isBlocked={isChurchBlocked} 
        />
      </div>
    </DashboardLayout>
  );
};

export default Membros;
