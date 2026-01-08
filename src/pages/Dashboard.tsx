import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Users, List, Plus, Mail, Loader2, Clock, TrendingUp, Sparkles, ChevronRight, ArrowUpRight, Activity, Target, AlertTriangle } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChurch } from "@/hooks/useChurch";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useSchedules } from "@/hooks/useScheduleData";
import { format, parseISO } from "date-fns"; // Importando parseISO
import { ptBR } from "date-fns/locale";
import DashboardLayout from "@/components/DashboardLayout";
import { cn } from "@/lib/utils";
import ChurchCreationFallback from "@/components/ChurchCreationFallback";

const Dashboard = () => {
  const { user } = useAuth();
  const { 
    churchId, 
    church, 
    isLoading: isLoadingChurch, 
    isTrialActive, 
    daysLeftInSubscription, // Usamos esta variável para todos os contadores de dias restantes
    isSubscriptionActive, // Indica se o acesso premium/trial está ativo
  } = useChurch();
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats(churchId);
  const { data: schedules, isLoading: isLoadingSchedules } = useSchedules(churchId);

  if (isLoadingChurch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  // Se o usuário está logado, mas não tem igreja, renderiza o fallback de criação.
  if (user && !churchId) {
    return (
      <DashboardLayout
        title="Configuração Necessária"
        description="Crie sua primeira igreja para começar a gerenciar escalas."
      >
        <ChurchCreationFallback />
      </DashboardLayout>
    );
  }

  const churchName = church?.name || "Sua Igreja";
  
  // O banner de aviso deve aparecer se o plano for 'free' (trial ou cancelado)
  // E o acesso não estiver mais ativo (isSubscriptionActive = false)
  const showExpiredBanner = church?.subscription_plan === 'free' && !isSubscriptionActive;
  
  // O banner de aviso de dias restantes deve aparecer se o plano for 'free'
  // E o acesso ainda estiver ativo (isSubscriptionActive = true)
  const showDaysLeftBanner = church?.subscription_plan === 'free' && isSubscriptionActive;

  return (
    <DashboardLayout 
      title={
        <div className="flex items-center gap-3">
          <span className="text-3xl">👋</span>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Bem-vindo(a) à {churchName}!
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Gerencie seus ministérios e escalas de forma inteligente
            </p>
          </div>
        </div>
      }
      description=""
    >
      <div className="space-y-8">
        
        {/* Trial/Expiration Banner */}
        {(showDaysLeftBanner || showExpiredBanner) && (
          <Card className={cn(
            "p-4 flex items-center gap-4 shadow-lg",
            showDaysLeftBanner 
              ? "bg-amber-500/10 border-amber-500/50 text-amber-600" 
              : "bg-destructive/10 border-destructive/50 text-destructive"
          )}>
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <div className="flex-1">
              {showDaysLeftBanner ? (
                <p className="font-medium">
                  {isTrialActive ? "Seu período de teste gratuito termina em" : "Seu acesso premium termina em"} <span className="font-bold">{daysLeftInSubscription} dia{daysLeftInSubscription !== 1 ? 's' : ''}</span>. Aproveite todas as funções ilimitadas!
                </p>
              ) : (
                <p className="font-medium">
                  Seu período de acesso expirou. Para continuar usando todas as funcionalidades, por favor, faça um upgrade.
                </p>
              )}
            </div>
            <Link to="/settings">
              <Button 
                variant={showDaysLeftBanner ? "default" : "destructive"} 
                className={cn(
                  "flex-shrink-0",
                  showDaysLeftBanner ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-destructive hover:bg-destructive/90 text-white"
                )}
              >
                {showDaysLeftBanner ? "Ver Planos" : "Fazer Upgrade"}
              </Button>
            </Link>
          </Card>
        )}

        {/* Quick Actions - Premium Cards */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1 w-8 bg-gradient-to-r from-primary to-primary/20 rounded-full" />
            <h2 className="text-lg font-bold text-foreground/80 uppercase tracking-wide">Ações Rápidas</h2>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4">
            <Link to="/escalas/nova" className="group">
              <Card className="relative overflow-hidden p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border-border/50 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <Plus className="w-7 h-7 text-violet-500" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-violet-500 transition-colors">Nova Escala</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Crie uma nova escala ministerial
                  </p>
                  <div className="flex items-center text-xs font-semibold text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    Começar agora <ChevronRight className="w-3 h-3 ml-1" />
                  </div>
                </div>
              </Card>
            </Link>
            
            <Link to="/escalas" className="group">
              <Card className="relative overflow-hidden p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border-border/50 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <Clock className="w-7 h-7 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-blue-500 transition-colors">Ver Escalas</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Visualize e edite escalas futuras
                  </p>
                  <div className="flex items-center text-xs font-semibold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    Acessar <ChevronRight className="w-3 h-3 ml-1" />
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/ministerios" className="group">
              <Card className="relative overflow-hidden p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border-border/50 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <List className="w-7 h-7 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-emerald-500 transition-colors">Ministérios</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Gerenciar ministérios cadastrados
                  </p>
                  <div className="flex items-center text-xs font-semibold text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    Gerenciar <ChevronRight className="w-3 h-3 ml-1" />
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/membros" className="group">
              <Card className="relative overflow-hidden p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border-border/50 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <Users className="w-7 h-7 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-amber-500 transition-colors">Membros</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Gerenciar membros cadastrados
                  </p>
                  <div className="flex items-center text-xs font-semibold text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver todos <ChevronRight className="w-3 h-3 ml-1" />
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Stats Overview - Premium Design */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-1 w-8 bg-gradient-to-r from-primary to-primary/20 rounded-full" />
              <h2 className="text-lg font-bold text-foreground/80 uppercase tracking-wide">Visão Geral</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="w-4 h-4" />
              <span>Atualizado agora</span>
            </div>
          </div>

          {isLoadingStats ? (
            <div className="grid md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-6 h-[140px] animate-pulse bg-muted/50" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="relative overflow-hidden p-6 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent border-violet-500/20 hover:shadow-lg transition-all group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/20 to-transparent rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Escalas Ativas</span>
                    <div className="p-2 rounded-lg bg-violet-500/20">
                      <Calendar className="w-4 h-4 text-violet-500" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold mb-2">{stats?.activeSchedules || 0}</p>
                  <div className="flex items-center gap-1 text-xs text-violet-500">
                    <TrendingUp className="w-3 h-3" />
                    <span className="font-medium">Próximas semanas</span>
                  </div>
                </div>
              </Card>

              <Card className="relative overflow-hidden p-6 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20 hover:shadow-lg transition-all group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Ministérios</span>
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <List className="w-4 h-4 text-emerald-500" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold mb-2">{stats?.ministries || 0}</p>
                  <div className="flex items-center gap-1 text-xs text-emerald-500">
                    <Target className="w-3 h-3" />
                    <span className="font-medium">Cadastrados</span>
                  </div>
                </div>
              </Card>

              <Card className="relative overflow-hidden p-6 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20 hover:shadow-lg transition-all group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Membros</span>
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Users className="w-4 h-4 text-blue-500" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold mb-2">{stats?.members || 0}</p>
                  <div className="flex items-center gap-1 text-xs text-blue-500">
                    <Activity className="w-3 h-3" />
                    <span className="font-medium">Ativos</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Recent Schedules - Premium Design */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-1 w-8 bg-gradient-to-r from-primary to-primary/20 rounded-full" />
              <h2 className="text-lg font-bold text-foreground/80 uppercase tracking-wide">Próximas Escalas</h2>
            </div>
            <Link to="/escalas">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                Ver todas <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <Card className="overflow-hidden bg-gradient-to-br from-card to-card/50 border-border/50 shadow-xl">
            {isLoadingSchedules ? (
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : schedules && schedules.length > 0 ? (
              <div className="divide-y divide-border/50">
                {schedules.map((schedule, idx) => {
                  // Usando parseISO para garantir que a data seja interpretada corretamente
                  const date = parseISO(schedule.event_date);
                  const isToday = new Date().toDateString() === date.toDateString();
                  
                  return (
                    <Link
                      key={schedule.id}
                      to="/escalas"
                      className="group block p-5 hover:bg-accent/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        {/* Date Badge */}
                        <div className={cn(
                          "flex flex-col items-center justify-center w-14 h-14 rounded-xl font-bold shrink-0 shadow-sm",
                          isToday
                            ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                            : "bg-gradient-to-br from-accent to-accent/80 text-accent-foreground"
                        )}>
                          <span className="text-xl leading-none">{date.getDate()}</span>
                          <span className="text-[9px] uppercase mt-0.5">
                            {format(date, "MMM", { locale: ptBR })}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">
                              {schedule.title || schedule.ministries?.name || "Escala Sem Título"}
                            </h3>
                            {isToday && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 animate-pulse">
                                HOJE
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5 capitalize">
                              <Calendar className="w-3.5 h-3.5" />
                              {format(date, "EEEE", { locale: ptBR })}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {schedule.event_time.substring(0, 5)} {/* APLICANDO HH:MM */}
                            </span>
                          </div>
                        </div>

                        {/* Ministry Badge */}
                        <div className="hidden md:flex items-center gap-2">
                          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                            {schedule.ministries?.name || "Ministério"}
                          </span>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Calendar className="w-10 h-10 text-primary/50" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhuma escala cadastrada</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Comece criando sua primeira escala ministerial
                </p>
                <Link to="/escalas/nova">
                  <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Escala
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
