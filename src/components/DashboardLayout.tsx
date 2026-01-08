import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar, Users, List, LogOut, Menu, LayoutDashboard, Clock, Settings, X, ChevronDown, Check, Plus, AlertTriangle, Lock, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useChurch } from "@/hooks/useChurch";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import Logo from "@/components/Logo";

interface DashboardLayoutProps {
  children: ReactNode;
  title: ReactNode; // Alterado para ReactNode para aceitar elementos complexos
  description: string;
}

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Escalas", href: "/escalas", icon: Clock },
  { name: "Templates", href: "/templates", icon: Copy },
  { name: "Ministérios", href: "/ministerios", icon: List },
  { name: "Membros", href: "/membros", icon: Users },
  { name: "Configurações", href: "/settings", icon: Settings },
];

const ChurchInfoDisplay = () => {
  const { church } = useChurch();

  return (
    <div className="p-4 border-b border-sidebar-border">
      <p className="text-sm font-semibold text-sidebar-foreground truncate">{church?.name || "Carregando..."}</p>
      <p className="text-xs text-sidebar-foreground/70 mt-1">Igreja Ativa</p>
    </div>
  );
};

const SidebarContent = ({ onClose, isBlocked }: { onClose?: () => void, isBlocked: boolean }) => {
  const { pathname } = useLocation();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-center gap-2">
        <Logo size="sm" />
      </div>

      {/* Church Info */}
      <ChurchInfoDisplay />

      <ScrollArea className="flex-1 py-4 px-3">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            // Permite acesso apenas a Dashboard e Configurações se bloqueado
            const isCoreRoute = item.href === '/dashboard' || item.href === '/settings';
            const isDisabled = isBlocked && !isCoreRoute;

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={isDisabled ? (e) => e.preventDefault() : onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-sidebar-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.name}
                {isDisabled && <Lock className="w-3 h-3 ml-auto text-destructive" />}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
};

const DashboardLayout = ({ children, title, description }: DashboardLayoutProps) => {
  const { user, signOut } = useAuth();
  const { church, isBlocked, isSubscriptionActive, daysLeftInSubscription } = useChurch();
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  // Lógica do Banner de Aviso de Expiração (3 dias)
  const showSubscriptionWarning =
    church?.subscription_plan !== 'free' &&
    church?.subscription_end_date &&
    isSubscriptionActive &&
    daysLeftInSubscription <= 3;

  // Se estiver bloqueado, mas a rota for /settings, /churches/new OU /setup-church, permite a visualização.
  const isSettingsOrNewChurch = location.pathname === '/settings' || location.pathname === '/churches/new' || location.pathname === '/setup-church';
  const shouldBlockContent = isBlocked && !isSettingsOrNewChurch;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 border-r border-border bg-sidebar-background fixed h-full">
        <SidebarContent isBlocked={isBlocked} />
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between text-sm text-sidebar-foreground/80 mb-2">
            <span className="truncate">{user?.email}</span>
          </div>
          <Button variant="secondary" className="w-full" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64">
        {/* Header (Mobile/Desktop) */}
        <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between lg:justify-end">
            {isMobile && (
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <SidebarContent onClose={() => setIsSheetOpen(false)} isBlocked={isBlocked} />
                  <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
                    <Button variant="secondary" className="w-full" onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            )}

            <div className="flex items-center gap-4">
              {/* Removed user email display here */}
              {isMobile && (
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>

          {/* Subscription Warning Banner (Paid Plans) */}
          {showSubscriptionWarning && (
            <Card className="p-4 mb-6 flex items-center gap-4 bg-amber-500/10 border-amber-500/50 text-amber-600 shadow-lg">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">
                  Aviso: Sua assinatura ({church?.subscription_plan}) expira em <span className="font-bold">{daysLeftInSubscription} dia{daysLeftInSubscription !== 1 ? 's' : ''}</span>.
                  Renove seu plano para evitar a interrupção do serviço.
                </p>
              </div>
              <Link to="/settings">
                <Button variant="default" className="flex-shrink-0 bg-amber-500 hover:bg-amber-600 text-white">
                  Renovar
                </Button>
              </Link>
            </Card>
          )}

          {/* Blocked Content Banner (Free Expired or Paid Expired) */}
          {shouldBlockContent ? (
            <Card className="p-12 text-center border-destructive/50 bg-destructive/5 shadow-2xl">
              <Lock className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-destructive mb-3">Acesso Bloqueado</h2>
              <p className="text-lg text-destructive/80 mb-6">
                Seu período de teste gratuito expirou ou sua assinatura paga foi cancelada.
              </p>
              <Link to="/settings">
                <Button size="lg" variant="destructive" className="bg-destructive hover:bg-destructive/90">
                  Fazer Upgrade ou Renovar Assinatura
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground mt-4">
                Você ainda pode acessar o Dashboard e Configurações.
              </p>
            </Card>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
