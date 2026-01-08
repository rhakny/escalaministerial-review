import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ChurchProvider } from "./hooks/useChurch";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute"; // Importando AdminRoute
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import AdminLogin from "./pages/AdminLogin"; // Importando AdminLogin
import AdminDashboard from "./pages/AdminDashboard"; // Importando AdminDashboard
import Dashboard from "./pages/Dashboard";
import Ministerios from "./pages/Ministerios";
import Membros from "./pages/Membros";
import NovaEscala from "./pages/NovaEscala";
import Escalas from "./pages/Escalas";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import PublicSchedule from "./pages/PublicSchedule";
import PublicResponse from "./pages/PublicResponse";
import SetupChurchPage from "./pages/SetupChurchPage"; // Importando SetupChurchPage
import HowItWorks from "./pages/HowItWorks";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TemplatesPage from "./pages/Templates"; // Importando TemplatesPage
import InviteAcceptance from "./pages/InviteAcceptance"; // NOVO: Importando InviteAcceptance

const queryClient = new QueryClient();

// Componente Wrapper para rotas que precisam de autenticação e contexto da Igreja
const ProtectedChurchRoute = ({ children }: { children: React.ReactNode }) => (
  <ChurchProvider>
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  </ChurchProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            
            {/* Rotas de Administração da Plataforma */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

            {/* Rotas Públicas */}
            <Route path="/schedule/:scheduleId" element={<PublicSchedule />} />
            <Route path="/response/:token" element={<PublicResponse />} />
            <Route path="/invite/:token" element={<InviteAcceptance />} /> {/* NOVO: Rota de Convite */}

            {/* Rotas Protegidas (Usuário Comum/Church Admin) */}
            <Route path="/setup-church" element={<ProtectedChurchRoute><SetupChurchPage /></ProtectedChurchRoute>} />
            <Route path="/dashboard" element={<ProtectedChurchRoute><Dashboard /></ProtectedChurchRoute>} />
            <Route path="/ministerios" element={<ProtectedChurchRoute><Ministerios /></ProtectedChurchRoute>} />
            <Route path="/membros" element={<ProtectedChurchRoute><Membros /></ProtectedChurchRoute>} />
            <Route path="/escalas" element={<ProtectedChurchRoute><Escalas /></ProtectedChurchRoute>} />
            <Route path="/escalas/nova" element={<ProtectedChurchRoute><NovaEscala /></ProtectedChurchRoute>} />
            <Route path="/settings" element={<ProtectedChurchRoute><SettingsPage /></ProtectedChurchRoute>} />
            <Route path="/templates" element={<ProtectedChurchRoute><TemplatesPage /></ProtectedChurchRoute>} />
            
            {/* Rota de fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
