import { Navigate, Link, useNavigate } from "react-router-dom";
import { useChurch } from "@/hooks/useChurch";
import { useUpdateChurch, useDeleteChurch } from "@/hooks/useChurchData";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Settings, DollarSign, Home, Check, Plus, Edit, Mail, MapPin, Trash2, UserX, Clock, X, Shield, Zap, Users, Repeat, AlertTriangle, MessageSquare, KeyRound, Crown, UserMinus, Copy, User } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCancelSubscription } from "@/hooks/useSubscriptionData";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { usePlans, Plan } from "@/hooks/usePlans";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client"; // Importando supabase para update
import { useChurchAdmins, ChurchAdmin } from "@/hooks/useChurchAdmins";
import { useCreateInvitation } from "@/hooks/useCreateInvitation"; // NOVO HOOK
import { useOwnerProfile } from "@/hooks/useOwnerProfile"; // NOVO: Importando useOwnerProfile

// Número de WhatsApp para renovação
const RENEWAL_WHATSAPP = "556993834215";

const churchFormSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  email: z.string().email("E-mail inválido."),
  address: z.string().optional(),
  theme_color: z.string().optional(),
});

const profileFormSchema = z.object({
  full_name: z.string().min(3, "O nome completo deve ter pelo menos 3 caracteres."),
});

const passwordFormSchema = z.object({
  newPassword: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

type ChurchFormValues = z.infer<typeof churchFormSchema>;
type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;
type Recurrence = 'monthly' | 'quarterly' | 'semiannual' | 'annual'; // ATUALIZADO

// Hook para remover o papel de um usuário (apenas para church_admin)
const useRemoveUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
      if (error) throw error;
    },
    onSuccess: (_, roleId) => {
      toast.success("Papel removido com sucesso!");
      // Invalida a lista de administradores
      queryClient.invalidateQueries({ queryKey: ["churchAdmins"] });
      queryClient.invalidateQueries({ queryKey: ["userChurchId"] });
    },
    onError: (error) => {
      console.error("Role Removal Error:", error);
      toast.error(error.message || "Erro ao remover o papel. Verifique as permissões (RLS).");
    }
  });
};

const SettingsPage = () => {
  const {
    churchId,
    church,
    isLoading: isLoadingChurch,
    isTrialActive,
    daysLeftInSubscription,
    isSubscriptionActive,
  } = useChurch();
  const { user, deleteUser } = useAuth();
  const navigate = useNavigate();
  const updateChurchMutation = useUpdateChurch();
  const deleteChurchMutation = useDeleteChurch();
  const cancelSubscriptionMutation = useCancelSubscription();
  const removeUserRoleMutation = useRemoveUserRole();
  const queryClient = useQueryClient();

  const { data: plans, isLoading: isLoadingPlans } = usePlans();
  const createInvitationMutation = useCreateInvitation();
  const { data: churchAdmins, isLoading: isLoadingAdmins } = useChurchAdmins(churchId);

  // NOVO: Busca o perfil do proprietário (o perfil do usuário logado é buscado implicitamente pelo useOwnerProfile se user.id === church.owner_id)
  const { data: ownerProfile, isLoading: isLoadingOwner } = useOwnerProfile(church?.owner_id || null);

  // Lógica de Fallback Aprimorada:
  let ownerName = ownerProfile?.full_name || ownerProfile?.email || 'Proprietário Desconhecido';

  // Se o usuário logado for o proprietário e o perfil estiver incompleto, usa o email do auth.
  const isChurchOwner = user?.id === church?.owner_id;
  if (isChurchOwner && ownerName === 'Proprietário Desconhecido' && user?.email) {
    ownerName = user.email;
  }

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedRecurrence, setSelectedRecurrence] = useState<Recurrence>('monthly'); // NOVO ESTADO

  const churchForm = useForm<ChurchFormValues>({
    resolver: zodResolver(churchFormSchema),
    defaultValues: {
      name: church?.name || "",
      email: church?.email || "",
      address: church?.address || "",
      theme_color: church?.theme_color || "",
    },
  });

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: ownerProfile?.full_name || user?.user_metadata.full_name || "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { handleSubmit: handleChurchSubmit, formState: churchFormState, register: registerChurch, reset: resetChurch } = churchForm;
  const { isSubmitting: isChurchSubmitting, errors: churchErrors } = churchFormState;

  const { handleSubmit: handleProfileSubmit, formState: profileFormState, register: registerProfile, reset: resetProfile } = profileForm;
  const { isSubmitting: isProfileSubmitting, errors: profileErrors } = profileFormState;

  const { handleSubmit: handlePasswordSubmit, formState: passwordFormState, register: registerPassword, reset: resetPassword } = passwordForm;
  const { isSubmitting: isPasswordSubmitting, errors: passwordErrors } = passwordFormState;

  // Encontra o plano atual (fallback para 'free' se a lista de planos não carregou)
  const defaultFreePlan: Plan = {
    id: 'free',
    name: 'Teste Gratuito',
    description: '15 dias de funções ilimitadas.',
    churchLimit: 1,
    memberLimit: 9999,
    prices: {
      monthly: { amount: 0, display: 'R$ 0,00' },
      quarterly: { amount: 0, display: 'R$ 0,00' },
      semiannual: { amount: 0, display: 'R$ 0,00' },
      annual: { amount: 0, display: 'R$ 0,00' },
    },
    features: ['15 dias de teste', 'Funções ilimitadas']
  };
  const currentPlanId = church?.subscription_plan || 'free';
  const currentPlan = plans?.find(p => p.id === currentPlanId) || defaultFreePlan;

  // 1. Atualiza o formulário da igreja quando a igreja selecionada muda
  useEffect(() => {
    if (church) {
      resetChurch({
        name: church.name,
        email: church.email,
        address: church.address || "",
        theme_color: church.theme_color || "",
      });
    }
  }, [church, resetChurch]);

  // 2. Atualiza o formulário do perfil quando o perfil do proprietário muda (se for o usuário logado)
  useEffect(() => {
    if (user && user.id === church?.owner_id && ownerProfile) {
      resetProfile({
        full_name: ownerProfile.full_name || user.user_metadata.full_name || "",
      });
    }
  }, [user, church, ownerProfile, resetProfile]);

  if (isLoadingChurch || isLoadingPlans || isLoadingOwner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const showChurchInfo = !!churchId;

  const onChurchSubmit = async (values: ChurchFormValues) => {
    if (!churchId) {
      toast.error("Nenhuma igreja selecionada para atualizar.");
      return;
    }

    try {
      await updateChurchMutation.mutateAsync({
        id: churchId,
        updates: {
          name: values.name,
          address: values.address || null,
        }
      });
    } catch (error) {
      // Erro tratado pelo hook de mutação
    }
  };

  const onProfileSubmit = async (values: ProfileFormValues) => {
    if (!user) return;

    try {
      // Apenas o proprietário pode atualizar o perfil (RLS)
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: values.full_name })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Nome completo atualizado com sucesso!");

      // Invalida o cache do perfil do proprietário para refletir a mudança
      queryClient.invalidateQueries({ queryKey: ["ownerProfile", user.id] });

    } catch (error: any) {
      console.error("Profile Update Error:", error);
      toast.error(error.message || "Erro ao atualizar o perfil. Verifique as permissões.");
    }
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    try {
      // 1. Atualiza a senha
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
        // 2. Remove o metadado de reset de senha
        data: { needs_password_reset: false },
      });

      if (error) {
        throw error;
      }

      toast.success("Senha alterada com sucesso!");
      resetPassword();

      // 3. Força a atualização do contexto de autenticação para refletir a mudança no metadado
      queryClient.invalidateQueries({ queryKey: ["supabase.auth.session"] });

    } catch (error: any) {
      console.error("Password Update Error:", error);
      toast.error(error.message || "Erro ao alterar a senha.");
    }
  };

  const handleDeleteChurch = async () => {
    if (!churchId) return;

    try {
      await deleteChurchMutation.mutateAsync(churchId);
      // Redireciona para o setup, pois a igreja foi excluída
      navigate("/setup-church");
    } catch (error) {
      // Erro tratado pelo hook de mutação
    }
  };

  const handleDeleteAccount = async () => {
    if (hasActiveSubscription) {
      toast.error("Você possui uma assinatura ativa. Por favor, cancele todos os planos antes de excluir sua conta.");
      return;
    }

    if (churchId) {
      toast.error("Você ainda administra uma igreja. Exclua a igreja antes de excluir sua conta.");
      return;
    }

    try {
      await deleteUser();
      toast.success("Sua conta foi excluída com sucesso. Redirecionando...");
      navigate("/");
    } catch (error) {
      toast.error("Erro ao tentar excluir a conta.");
    }
  };

  const handleCancelSubscription = async () => {
    if (!churchId) {
      toast.error("Nenhuma igreja selecionada.");
      return;
    }

    try {
      await cancelSubscriptionMutation.mutateAsync({ churchId });
    } catch (error) {
      // Handled by mutation hook
    }
  };

  const handleCreateInvitation = async () => {
    if (!churchId) {
      toast.error("Nenhuma igreja ativa para convidar.");
      return;
    }
    if (!inviteEmail || !inviteFullName) {
      toast.error("Preencha o nome completo e o e-mail do convidado.");
      return;
    }

    try {
      const result = await createInvitationMutation.mutateAsync({
        email: inviteEmail,
        full_name: inviteFullName,
        church_id: churchId,
        role: 'church_admin', // Convidando sempre como admin da igreja
      });

      setGeneratedToken(result.token);
      setIsInviteModalOpen(false);
      setIsLinkModalOpen(true);
      setInviteEmail('');
      setInviteFullName('');

    } catch (error) {
      // Handled by mutation hook
    }
  };

  const handleCopyLink = () => {
    if (generatedToken) {
      const link = `${window.location.origin}/invite/${generatedToken}`;
      navigator.clipboard.writeText(link);
      toast.success("Link de convite copiado para a área de transferência!");
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!isChurchOwner) {
      toast.error("Apenas o proprietário da igreja pode remover papéis de administrador.");
      return;
    }
    await removeUserRoleMutation.mutateAsync(roleId);
  };

  const handleRenewalCTA = () => {
    const priceDetail = currentPlan.prices[selectedRecurrence];
    const recurrenceText = {
      monthly: 'mensal',
      quarterly: 'trimestral',
      semiannual: 'semestral',
      annual: 'anual',
    }[selectedRecurrence];

    const message = encodeURIComponent(
      `Olá, gostaria de contratar/renovar o plano ${currentPlan.name} com recorrência ${recurrenceText} (${priceDetail.display}) para a igreja ${church?.name || 'Minha Igreja'}. Meu e-mail de cadastro é ${user?.email}.`
    );
    const whatsappLink = `https://wa.me/${RENEWAL_WHATSAPP}?text=${message}`;
    window.open(whatsappLink, '_blank');
  };

  const isDeleting = deleteChurchMutation.isPending;
  const isSaving = isChurchSubmitting || isDeleting;
  const isCancelling = cancelSubscriptionMutation.isPending;
  const isCreatingInvitation = createInvitationMutation.isPending;
  const isRemovingRole = removeUserRoleMutation.isPending;
  const hasActiveSubscription = currentPlanId !== 'free' && isSubscriptionActive;

  // Verifica se o usuário precisa definir a senha (para exibir o banner)
  const needsPasswordReset = user?.app_metadata?.needs_password_reset === true;

  // A exclusão da igreja só é permitida para o proprietário
  const isDeleteChurchDisabled = isSaving || !isChurchOwner;

  return (
    <DashboardLayout
      title="Configurações"
      description={`Gerencie as configurações de ${church?.name || 'sua conta'}.`}
    >
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="general" className="flex items-center gap-2 py-2">
            <Settings className="w-4 h-4" /> Geral
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2 py-2">
            <DollarSign className="w-4 h-4" /> Assinatura
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2 py-2">
            <Shield className="w-4 h-4" /> Avançado
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: GERAL */}
        <TabsContent value="general" className="mt-6 space-y-8">

          {/* Banner de Aviso de Senha (se for convidado) */}
          {needsPasswordReset && (
            <Card className="p-4 flex items-center gap-4 bg-destructive/10 border-destructive/50 text-destructive shadow-lg">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">
                  Atenção! Você acessou sua conta via convite. Por favor, defina uma senha permanente abaixo para garantir o acesso futuro.
                </p>
              </div>
            </Card>
          )}

          {/* Seção de Informações do Perfil */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Informações do Meu Perfil
            </h2>
            <Card className="p-6">
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    placeholder="Seu Nome Completo"
                    {...registerProfile("full_name")}
                    disabled={isProfileSubmitting}
                    className={profileErrors.full_name ? "border-destructive" : ""}
                  />
                  {profileErrors.full_name && (
                    <p className="text-sm text-destructive mt-1">{profileErrors.full_name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">E-mail de Login (Não Editável)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled={true}
                    className="cursor-not-allowed"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isProfileSubmitting} className="sm:w-auto">
                    {isProfileSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Perfil
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Seção de Informações da Igreja */}
          {showChurchInfo ? (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Home className="w-5 h-5 text-primary" />
                Informações da Igreja
              </h2 >
              <Card className="p-6">
                <form onSubmit={handleChurchSubmit(onChurchSubmit)} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome da Igreja</Label>
                      <Input
                        id="name"
                        placeholder="Nome da Igreja"
                        {...registerChurch("name")}
                        disabled={isSaving}
                        className={churchErrors.name ? "border-destructive" : ""}
                      />
                      {churchErrors.name && (
                        <p className="text-sm text-destructive mt-1">{churchErrors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">E-mail de Contato</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="contato@igreja.com"
                        {...registerChurch("email")}
                        disabled={true}
                        className={cn(churchErrors.email ? "border-destructive" : "", "cursor-not-allowed")}
                      />
                      {churchErrors.email && (
                        <p className="text-sm text-destructive mt-1">{churchErrors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Endereço / Localização (Opcional)</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="address"
                        placeholder="Rua Principal, 123"
                        {...registerChurch("address")}
                        disabled={isSaving}
                        className={cn("pl-10", churchErrors.address ? "border-destructive" : "")}
                      />
                      {churchErrors.address && (
                        <p className="text-sm text-destructive mt-1">{churchErrors.address.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
                    <Button type="submit" disabled={isSaving} className="sm:w-auto">
                      {isChurchSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Salvar Alterações
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          ) : (
            <Card className="p-6 border-dashed bg-muted/50 text-center">
              <Home className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold">Nenhuma igreja configurada.</p>
              <p className="text-sm text-muted-foreground">Por favor, vá para o <Link to="/setup-church" className="text-primary hover:underline">Setup Inicial</Link>.</p>
            </Card>
          )}

          {/* Seção de Alterar Senha */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Alterar Senha
            </h2>
            <Card className="p-6">
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    {...registerPassword("newPassword")}
                    disabled={isPasswordSubmitting}
                    className={passwordErrors.newPassword ? "border-destructive" : ""}
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-destructive mt-1">{passwordErrors.newPassword.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...registerPassword("confirmPassword")}
                    disabled={isPasswordSubmitting}
                    className={passwordErrors.confirmPassword ? "border-destructive" : ""}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-destructive mt-1">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isPasswordSubmitting} className="sm:w-auto">
                    {isPasswordSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Atualizar Senha
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Seção de Administradores */}
          {showChurchInfo && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Administradores e Líderes da Igreja
              </h2>

              <Card className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Convide outros líderes para ajudar a gerenciar as escalas e membros desta igreja.
                </p>

                <Button
                  variant="outline"
                  className="w-full border-dashed hover:bg-primary/5 hover:border-primary/50"
                  onClick={() => setIsInviteModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Gerar Link de Convite
                </Button>

                {/* Lista de Administradores */}
                <div className="pt-4 border-t border-border/50">
                  <h3 className="font-semibold text-base mb-3">Usuários com Acesso de Gestão ({churchAdmins?.length || 0})</h3>

                  {isLoadingAdmins ? (
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  ) : churchAdmins && churchAdmins.length > 0 ? (
                    <div className="space-y-2">
                      {churchAdmins.map((admin) => {
                        // Fallback para o email se o nome completo estiver faltando
                        const displayName = admin.profiles?.full_name || admin.profiles?.email || 'Usuário Desconhecido';
                        const displayEmail = admin.profiles?.email;

                        return (
                          <div
                            key={admin.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{displayName}</p>
                                {displayEmail && (
                                  <p className="text-xs text-muted-foreground">{displayEmail}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "px-3 py-1 text-xs font-semibold rounded-full",
                                admin.role === 'church_admin' ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"
                              )}>
                                {admin.role === 'church_admin' ? 'Admin' : 'Líder'}
                              </span>

                              {/* Botão de Remoção (Apenas para o Proprietário e se não for ele mesmo) */}
                              {isChurchOwner && admin.user_id !== user?.id && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      disabled={isRemovingRole}
                                      className="text-destructive hover:bg-destructive/10"
                                    >
                                      <UserMinus className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remover Papel de {displayName}?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta ação removerá o papel de <span className="font-semibold">{admin.role}</span> deste usuário na igreja. Ele perderá o acesso ao dashboard.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleRemoveRole(admin.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                      >
                                        Remover
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}

                              {admin.user_id === church?.owner_id && (
                                <div title="Proprietário da Igreja">
                                  <Crown className="w-4 h-4 text-amber-500" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum administrador ou líder encontrado.</p>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Para remover o papel de um usuário, você deve ser o proprietário da igreja.
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: ASSINATURA (Simplificada) */}
        <TabsContent value="subscription" className="mt-6 space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Plano Atual
            </h2>

            {/* Current Plan Card */}
            <Card className="p-6 mb-6 border-2 border-primary/50 shadow-xl bg-gradient-to-r from-primary/5 to-card">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-primary mb-1">Plano Ativo</p>
                  <h3 className="text-3xl font-extrabold mb-1">{currentPlan.name}</h3>
                  <p className="text-muted-foreground text-sm">
                    {currentPlan.description}
                  </p>
                </div>
                <div className="text-left md:text-right flex-shrink-0">
                  <div className={cn(
                    "font-semibold text-lg",
                    isSubscriptionActive ? "text-emerald-600" : "text-destructive"
                  )}>
                    {daysLeftInSubscription} dias restantes
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentPlan.memberLimit > 1000 ? 'Membros Ilimitados' : `${currentPlan.memberLimit} Membros`} / {currentPlan.churchLimit} {currentPlan.churchLimit === 1 ? 'Igreja' : 'Igrejas'}
                  </p>
                </div>
              </div>

              {/* CTA de Renovação/Upgrade */}
              <div className="pt-4 mt-4 border-t border-border/50 flex flex-col sm:flex-row justify-end gap-3">
                {/* Botão de Cancelamento (se for pago) */}
                {currentPlanId !== 'free' && isSubscriptionActive && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isCancelling}
                        className="text-destructive hover:bg-destructive/10 hover:border-destructive/50"
                      >
                        {isCancelling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                        Cancelar Assinatura
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar Assinatura?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Ao cancelar, seu plano será definido como 'Teste Gratuito' no final do ciclo de pagamento atual ({format(new Date(church?.subscription_end_date || ''), 'dd/MM/yyyy', { locale: ptBR })}). Você manterá o acesso pago até essa data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Manter Assinatura</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancelSubscription}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Confirmar Cancelamento
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {/* Botão de Renovação/Upgrade (CTA WhatsApp) */}
                <Button
                  onClick={handleRenewalCTA}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Quero renovar meu plano
                </Button>
              </div>
            </Card>

            {/* Opções de Planos (Apenas visualização) */}
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Conheça Nossos Planos
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {plans?.filter(p => p.id !== 'free').map((plan) => {
                const isCurrent = currentPlanId === plan.id;

                return (
                  <Card
                    key={plan.id}
                    className={cn(
                      "p-6 border-2 transition-all duration-300",
                      isCurrent
                        ? "border-primary shadow-xl ring-4 ring-primary/10"
                        : "border-border/50 hover:shadow-lg"
                    )}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      {isCurrent && (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                          Atual
                        </span>
                      )}
                    </div>

                    {/* Recorrência Selector */}
                    <div className="mb-4">
                      <Tabs defaultValue="monthly" onValueChange={(value) => setSelectedRecurrence(value as Recurrence)}>
                        <TabsList className="grid w-full grid-cols-4 h-auto p-1">
                          <TabsTrigger value="monthly" className="text-xs py-1">Mensal</TabsTrigger>
                          <TabsTrigger value="quarterly" className="text-xs py-1">Trimestral</TabsTrigger>
                          <TabsTrigger value="semiannual" className="text-xs py-1">Semestral</TabsTrigger>
                          <TabsTrigger value="annual" className="text-xs py-1">Anual</TabsTrigger>
                        </TabsList>
                        <div className="mt-3 text-center">
                          <TabsContent value="monthly" className="mt-0">
                            <p className="text-3xl font-extrabold">
                              {plan.prices.monthly.display}
                              <span className="text-sm font-normal text-muted-foreground">/mês</span>
                            </p>
                          </TabsContent>
                          <TabsContent value="quarterly" className="mt-0">
                            <p className="text-3xl font-extrabold">
                              {plan.prices.quarterly.display}
                              <span className="text-sm font-normal text-muted-foreground">/trimestre</span>
                            </p>
                            <p className="text-xs text-emerald-500 font-medium mt-1">10% de desconto</p>
                          </TabsContent>
                          <TabsContent value="semiannual" className="mt-0">
                            <p className="text-3xl font-extrabold">
                              {plan.prices.semiannual.display}
                              <span className="text-sm font-normal text-muted-foreground">/semestre</span>
                            </p>
                            <p className="text-xs text-emerald-500 font-medium mt-1">15% de desconto</p>
                          </TabsContent>
                          <TabsContent value="annual" className="mt-0">
                            <p className="text-3xl font-extrabold">
                              {plan.prices.annual.display}
                              <span className="text-sm font-normal text-muted-foreground">/ano</span>
                            </p>
                            <p className="text-xs text-emerald-500 font-medium mt-1">20% de desconto</p>
                          </TabsContent>
                        </div>
                      </Tabs>
                    </div>

                    <p className="text-muted-foreground mb-4">{plan.description}</p>

                    <ul className="space-y-2 text-sm mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                      onClick={handleRenewalCTA}
                      disabled={isCurrent}
                    >
                      {isCurrent ? "Plano Ativo" : "Fazer Upgrade"}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: AVANÇADO */}
        <TabsContent value="advanced" className="mt-6 space-y-8">

          {/* Seção de Exclusão da Igreja */}
          {showChurchInfo && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                Excluir Igreja
              </h2>
              <Card className="p-6 border-destructive/50 bg-destructive/5">
                <p className="text-sm text-destructive mb-4">
                  A exclusão da igreja é permanente e removerá todos os dados associados (ministérios, membros, escalas).
                </p>

                {!isChurchOwner && (
                  <div className="p-3 mb-4 rounded-lg bg-destructive/20 border border-destructive/70 text-destructive text-sm font-medium">
                    Apenas o proprietário da igreja (<span className="font-bold">{ownerName}</span>) pode realizar esta ação.
                  </div>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={isDeleteChurchDisabled}
                      className="sm:w-auto"
                    >
                      {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                      Excluir Igreja
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a igreja{" "}
                        <span className="font-semibold">{church?.name}</span> e todos os seus dados.
                        <p className="mt-2 font-bold text-destructive">
                          Atenção: Você perderá o acesso ao dashboard até criar uma nova igreja.
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteChurch}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Excluir Permanentemente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </Card>
            </div>
          )}

          {/* Seção de Exclusão de Conta */}
          <div className="pt-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-destructive">
              <UserX className="w-5 h-5" />
              Excluir Minha Conta
            </h2>
            <Card className="p-6 border-destructive/50 bg-destructive/5">
              <p className="text-sm text-destructive mb-4">
                A exclusão da conta é permanente. Todos os seus dados de perfil e acesso serão removidos.
              </p>

              {hasActiveSubscription && (
                <div className="p-3 mb-4 rounded-lg bg-destructive/20 border border-destructive/70 text-destructive text-sm font-medium">
                  Atenção: Você possui uma assinatura ativa ({currentPlan.name}). Cancele-a antes de prosseguir.
                </div>
              )}

              {churchId && (
                <div className="p-3 mb-4 rounded-lg bg-destructive/20 border border-destructive/70 text-destructive text-sm font-medium">
                  Atenção: Você ainda administra uma igreja. Exclua a igreja primeiro.
                </div>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={hasActiveSubscription || !!churchId}
                    className="sm:w-auto"
                  >
                    Excluir Conta Permanentemente
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Conta: {user?.email}</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação é irreversível. Você perderá o acesso a todos os dados e igrejas associadas.
                      <p className="mt-2 font-bold text-destructive">
                        Confirme que você cancelou todas as assinaturas e excluiu sua igreja antes de prosseguir.
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Sim, Excluir Minha Conta
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Invite User Dialog (Input de Dados) */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Gerar Convite de Administrador</DialogTitle>
            <DialogDescription>
              Preencha os dados para gerar um link de convite único.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="invite-name">Nome Completo do Convidado</Label>
              <Input
                id="invite-name"
                placeholder="Nome do Convidado"
                value={inviteFullName}
                onChange={(e) => setInviteFullName(e.target.value)}
                disabled={isCreatingInvitation}
              />
            </div>
            <div>
              <Label htmlFor="invite-email">E-mail do Convidado</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="convidado@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={isCreatingInvitation}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteModalOpen(false)} disabled={isCreatingInvitation}>
              Cancelar
            </Button>
            <Button onClick={handleCreateInvitation} disabled={isCreatingInvitation || !inviteEmail || !inviteFullName}>
              {isCreatingInvitation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Gerar Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Sharing Dialog (Output do Link) */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Link de Convite Gerado</DialogTitle>
            <DialogDescription>
              Copie e envie este link para o convidado. Ele expira em 7 dias.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Input
              id="invite-link"
              defaultValue={`${window.location.origin}/invite/${generatedToken}`}
              readOnly
              className="flex-1 truncate"
            />
            <Button
              type="button"
              onClick={handleCopyLink}
              variant="secondary"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsLinkModalOpen(false)} className="w-full">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SettingsPage;
