import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Home, DollarSign, UserPlus, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const AdminDashboard = () => {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4" style={{ background: "var(--gradient-hero)" }}>
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-destructive" />
            <h1 className="text-3xl font-bold text-destructive">Painel de Administração</h1>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Sair do Admin
          </Button>
        </div>

        <Card className="p-8 shadow-2xl border-destructive/50 bg-destructive/5 mb-10">
          <p className="text-lg font-semibold text-destructive mb-2">Acesso de Alto Nível</p>
          <p className="text-muted-foreground">
            Este painel permite gerenciar todas as igrejas, planos de assinatura e convites de novos administradores da plataforma.
          </p>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4 hover:shadow-xl transition-shadow">
            <Home className="w-8 h-8 text-primary" />
            <h2 className="text-xl font-bold">Gerenciar Igrejas</h2>
            <p className="text-muted-foreground text-sm">
              Visualize e edite todas as igrejas cadastradas na plataforma.
            </p>
            <Button variant="outline" disabled>Acessar (Futuro)</Button>
          </Card>
          
          <Card className="p-6 space-y-4 hover:shadow-xl transition-shadow">
            <DollarSign className="w-8 h-8 text-primary" />
            <h2 className="text-xl font-bold">Gerenciar Planos</h2>
            <p className="text-muted-foreground text-sm">
              Acompanhe assinaturas, pagamentos e configure preços.
            </p>
            <Button variant="outline" disabled>Acessar (Futuro)</Button>
          </Card>
          
          <Card className="p-6 space-y-4 hover:shadow-xl transition-shadow">
            <UserPlus className="w-8 h-8 text-primary" />
            <h2 className="text-xl font-bold">Convidar Administrador</h2>
            <p className="text-muted-foreground text-sm">
              Crie novas contas de usuário com o papel 'platform_admin'.
            </p>
            <Button variant="outline" disabled>Acessar (Futuro)</Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
