import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Home, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { TablesInsert } from "@/integrations/supabase/types";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useChurch } from "@/hooks/useChurch"; 
import { format } from "date-fns";
import { cn } from "@/lib/utils"; 

const formSchema = z.object({
  name: z.string().min(3, "O nome da igreja deve ter pelo menos 3 caracteres."),
  email: z.string().email("E-mail inválido para contato da igreja."),
  address: z.string().optional(),
});

type ChurchFormValues = z.infer<typeof formSchema>;

const ChurchCreationFallback = () => {
  const { user } = useAuth();
  const { churchId } = useChurch(); // Usamos apenas para verificar se já existe
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<ChurchFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: user?.email || "",
      address: "",
    },
  });

  const { handleSubmit, formState, register, reset } = form;
  const { isSubmitting, errors } = formState;

  // Atualiza o valor padrão do email se o usuário for carregado depois
  useEffect(() => {
    if (user?.email) {
      reset({ email: user.email });
    }
  }, [user, reset]);

  const onSubmit = async (values: ChurchFormValues) => {
    if (!user) {
      toast.error("Usuário não autenticado.");
      navigate("/auth");
      return;
    }
    
    if (churchId) {
        toast.error("Você já tem uma igreja configurada.");
        navigate("/dashboard");
        return;
    }

    try {
      // 1. Create the Church entry
      const churchData: TablesInsert<'churches'> = {
        name: values.name,
        email: values.email,
        address: values.address || null,
        owner_id: user.id,
        subscription_plan: 'free', // Default plan
        trial_start_date: format(new Date(), 'yyyy-MM-dd'), // Inicia o trial hoje
      };

      const { data: church, error: churchError } = await supabase
        .from('churches')
        .insert(churchData)
        .select()
        .single();

      if (churchError || !church) throw churchError || new Error("Falha ao criar a igreja.");

      // 2. Atribui o papel 'church_admin' à nova igreja
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'church_admin',
          church_id: church.id,
        });

      if (roleError) {
        console.error("Role Insertion Error:", roleError);
        // Não bloqueamos, mas logamos o erro.
      }
      
      // 3. Invalidate queries to refresh the church context
      await queryClient.invalidateQueries({ queryKey: ["userChurchId"] });
      await queryClient.invalidateQueries({ queryKey: ["churchDetails"] });

      toast.success(`Igreja "${church.name}" configurada com sucesso!`);
      
      // Redireciona para o dashboard após a criação
      navigate("/dashboard"); 

    } catch (error) {
      console.error("Setup Error:", error);
      toast.error("Erro ao configurar a igreja. Verifique se as políticas de segurança (RLS) estão ativas no Supabase.");
    }
  };

  const displayLoading = isSubmitting;

  return (
    <div className="min-h-[60vh] bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="p-8" style={{ background: "var(--gradient-card)" }}>
          <div className="mb-6 text-center">
            <Home className="w-10 h-10 text-primary mx-auto mb-3" />
            <h1 className="text-2xl font-bold mb-2">
              Configuração Inicial da Igreja
            </h1>
            <p className="text-muted-foreground text-sm">
              Parece que sua igreja ainda não está configurada. Vamos começar!
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Igreja</Label>
              <Input
                id="name"
                placeholder="Ex: Igreja Batista Central"
                {...register("name")}
                disabled={displayLoading}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">E-mail de Contato da Igreja (Seu E-mail)</Label>
              <Input
                id="email"
                type="email"
                placeholder="contato@igreja.com"
                {...register("email")}
                disabled={true} // Campo desabilitado
                className={cn(errors.email ? "border-destructive" : "", "cursor-not-allowed")}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="address">Endereço / Localização (Opcional)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="address"
                  placeholder="Rua Principal, 123"
                  {...register("address")}
                  disabled={displayLoading}
                  className={cn("pl-10", errors.address ? "border-destructive" : "")}
                />
                {errors.address && (
                  <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={displayLoading}>
              {displayLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Configuração
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ChurchCreationFallback;
