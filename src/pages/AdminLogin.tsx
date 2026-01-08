import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Shield, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { toast } from "sonner";
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

const signInSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255, "E-mail muito longo"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Redirect if already authenticated and is an admin
  useEffect(() => {
    if (user) {
      checkAdminRole(user.id);
    }
  }, [user]);

  const checkAdminRole = async (userId: string) => {
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'platform_admin',
    });

    if (error) {
      console.error("Error checking admin role:", error);
      return;
    }

    if (data === true) {
      navigate("/admin/dashboard");
    } else if (user) {
      // Se logado, mas não é admin, redireciona para o dashboard normal
      navigate("/dashboard");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const validated = signInSchema.parse(formData);

      // Tenta o login padrão
      await signIn(validated.email, validated.password);

      // O useEffect acima irá verificar o papel e redirecionar se for admin.

    } catch (error) {
      // O useAuth já trata o toast de erro de login
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Logo size="lg" />
        </div>

        <Card className="p-8" style={{ background: "var(--gradient-card)" }}>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-2">
              Entrar no Sistema
            </h1>
            <p className="text-muted-foreground text-sm">
              Use suas credenciais para acessar
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@escalaministerial.com.br"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <LogIn className="w-4 h-4 mr-2" />
              Entrar
            </Button>
          </form>
        </Card>

        <div className="mt-4 text-center">
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
            Voltar para o Login Padrão
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
