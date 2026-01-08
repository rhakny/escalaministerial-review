import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChurch } from "@/hooks/useChurch";
import { Loader2 } from "lucide-react";
import ChurchCreationFallback from "@/components/ChurchCreationFallback";
import DashboardLayout from "@/components/DashboardLayout";

const SetupChurchPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { churchId, isLoading: churchLoading, church } = useChurch();

  if (authLoading || churchLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Se não estiver logado, redireciona para o login
    return <Navigate to="/auth" replace />;
  }
  
  // Se o usuário já tem uma igreja configurada, redireciona para o dashboard
  if (churchId && church) {
    return <Navigate to="/dashboard" replace />;
  }

  // Se o usuário está logado, mas não tem igreja (o trigger falhou ou foi excluída), 
  // ele deve usar o fluxo de criação de igreja.
  return (
    <DashboardLayout
      title="Configuração Inicial"
      description="Crie sua primeira igreja para começar a gerenciar escalas."
    >
      <ChurchCreationFallback />
    </DashboardLayout>
  );
};

export default SetupChurchPage;
