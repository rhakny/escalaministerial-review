import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, Enums } from "@/integrations/supabase/types";
import { Loader2, Mail, Home, CheckCircle2, AlertTriangle, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/Logo";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";

type Invitation = Tables<'invitations'>;
type Church = Tables<'churches'>;

interface InvitationDetails extends Invitation {
    churches: Pick<Church, 'name'> | null;
}

const signupSchema = z.object({
  full_name: z.string().min(3, "Nome completo é obrigatório."),
  email: z.string().trim().email("E-mail inválido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

type SignupFormValues = z.infer<typeof signupSchema>;

// Hook para buscar detalhes do convite
const useInvitationDetails = (token: string | null) => {
  return useQuery<InvitationDetails | null>({
    queryKey: ["invitationDetails", token],
    queryFn: async () => {
      if (!token) return null;

      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          churches(name)
        `)
        .eq('token', token)
        .is('used_at', null)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (error) {
        // PGRST116 = No rows found
        if (error.code === 'PGRST116') return null;
        console.error("Error fetching invitation details:", error);
        return null;
      }
      
      return data as InvitationDetails;
    },
    enabled: !!token,
    staleTime: 0,
  });
};

// Hook para aceitar o convite (chama a Edge Function para criar o usuário)
const useAcceptInvitation = () => {
    const { signIn } = useAuth();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: async ({ token, full_name, email, password }: SignupFormValues & { token: string }) => {
            
            // 1. Tenta criar o usuário e aceitar o convite via Edge Function (Admin Client)
            const { data, error } = await supabase.functions.invoke('accept-invitation', {
                method: 'POST',
                body: JSON.stringify({ token, full_name, email, password }),
            });

            if (error) {
                const errorMessage = data?.message || error.message || "Falha ao aceitar o convite.";
                throw new Error(errorMessage);
            }
            
            // 2. Se a criação for bem-sucedida, faz o login imediato
            await signIn(email, password);
            
            return { status: 'success' };
        },
        onSuccess: () => {
            // O signIn já redireciona para /dashboard
            toast.success("Convite aceito! Você está logado como administrador da igreja.");
        },
        onError: (error) => {
            console.error("Acceptance Error:", error);
            toast.error(error.message || "Erro ao processar o convite. Verifique se o e-mail já está em uso.");
        }
    });
};

// O useLinkInvitation foi removido, pois a EF faz a vinculação.

const InviteAcceptance = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn } = useAuth();
  
  const { data: invitation, isLoading: isLoadingInvitation } = useInvitationDetails(token || null);
  const acceptMutation = useAcceptInvitation();

  const [isAccepting, setIsAccepting] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: "",
      email: invitation?.email || "",
      password: "",
    },
  });
  
  const { handleSubmit, formState, register, setValue } = form;
  const { isSubmitting, errors } = formState;

  // Atualiza o email padrão do formulário quando o convite carrega
  useEffect(() => {
    if (invitation?.email) {
        setValue('email', invitation.email);
    }
  }, [invitation, setValue]);
  
  // Lógica para redirecionar se o usuário já estiver logado com o email do convite
  useEffect(() => {
    if (user && invitation && !isAccepting) {
        if (user.email === invitation.email) {
            // Se o usuário está logado com o email correto, redireciona para o dashboard.
            // Assumimos que o trigger handle_new_user já atribuiu o papel.
            toast.info("Você já está logado com o e-mail do convite. Redirecionando...");
            navigate("/dashboard", { replace: true });
        } else {
            toast.error("Você está logado com um e-mail diferente do convite. Faça logout para continuar.");
        }
    }
  }, [user, invitation, navigate, isAccepting]);


  const onSubmit = async (values: SignupFormValues) => {
    if (!token) return;
    
    // Se o usuário já está logado, o useEffect acima deve ter lidado com isso.
    if (user) {
        toast.error("Você já está logado. Por favor, faça logout para aceitar o convite com outro e-mail.");
        return;
    }

    await acceptMutation.mutateAsync({ ...values, token });
  };

  if (isLoadingInvitation || authLoading || isAccepting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full border-destructive/50 bg-destructive/5">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Convite Inválido ou Expirado</h1>
          <p className="text-muted-foreground mb-6">
            O link de convite pode estar incorreto, expirado ou já foi utilizado.
          </p>
          <Link to="/">
            <Button>Voltar para o Início</Button>
          </Link>
        </Card>
      </div>
    );
  }
  
  const churchName = invitation.churches?.name || 'Igreja Desconhecida';
  const roleName = invitation.role === 'church_admin' ? 'Administrador' : 'Líder Ministerial';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" style={{ background: "var(--gradient-hero)" }}>
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Logo size="lg" />
        </div>

        <Card className="p-8 shadow-2xl" style={{ background: "var(--gradient-card)" }}>
          <div className="mb-6 text-center">
            <Home className="w-8 h-8 text-primary mx-auto mb-3" />
            <h1 className="text-2xl font-bold mb-2">
              Aceitar Convite
            </h1>
            <p className="text-muted-foreground text-sm">
              Você foi convidado(a) para ser <span className="font-semibold text-primary">{roleName}</span> na igreja <span className="font-semibold text-primary">{churchName}</span>.
            </p>
          </div>

          {user ? (
            <div className="text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="text-lg font-semibold">Você já está logado como {user.email}.</p>
                <p className="text-muted-foreground">
                    Se este é o e-mail correto, o convite já deve ter sido processado.
                </p>
                <Button onClick={() => navigate("/dashboard")} className="w-full">
                    Ir para o Dashboard
                </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <p className="text-sm font-medium text-primary">
                        E-mail do convite: {invitation.email}
                    </p>
                </div>
                
                <div>
                    <Label htmlFor="full_name">Seu Nome Completo</Label>
                    <Input
                        id="full_name"
                        placeholder="Seu Nome"
                        {...register("full_name")}
                        disabled={isSubmitting}
                        className={errors.full_name ? "border-destructive" : ""}
                    />
                    {errors.full_name && (
                        <p className="text-sm text-destructive mt-1">{errors.full_name.message}</p>
                    )}
                </div>
                
                <div>
                    <Label htmlFor="email">E-mail (Não Editável)</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        {...register("email")}
                        disabled={true}
                        className={cn(errors.email ? "border-destructive" : "", "cursor-not-allowed")}
                    />
                    {errors.email && (
                        <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="password">Crie uma Senha</Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        {...register("password")}
                        disabled={isSubmitting}
                        className={errors.password ? "border-destructive" : ""}
                    />
                    {errors.password && (
                        <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
                    )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    Criar Conta e Aceitar Convite
                </Button>
            </form>
          )}
        </Card>

        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InviteAcceptance;
