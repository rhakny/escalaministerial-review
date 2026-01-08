import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean; // NOVO: Status de administrador da plataforma
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Função auxiliar para verificar o papel de administrador da plataforma
const checkPlatformAdminRole = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  try {
    // Chama a função RPC has_role, passando apenas o user_id e o role 'platform_admin'
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'platform_admin',
      _church_id: null, // Garante que não estamos filtrando por igreja
    });
    if (error) {
      console.error("Error checking platform admin role:", error);
      return false;
    }
    return data === true;
  } catch (e) {
    console.error("RPC call failed:", e);
    return false;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  console.log("AuthProvider status:", {
    loading,
    user: !!user,
    session: !!session
  });
  const [isAdmin, setIsAdmin] = useState(false); // NOVO ESTADO
  const navigate = useNavigate();

  useEffect(() => {
    const handleSession = async (session: Session | null) => {
      console.log("AuthProvider: handleSession", { session });
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        console.log("AuthProvider: fetching admin role");
        const isPlatformAdmin = await checkPlatformAdminRole(currentUser.id);
        console.log("AuthProvider: admin role result", isPlatformAdmin);
        setIsAdmin(isPlatformAdmin);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
      console.log("AuthProvider: loading set to false");
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        handleSession(session);

        // Garante que o usuário seja redirecionado para a landing page após o logout
        if (event === 'SIGNED_OUT') {
          navigate("/", { replace: true });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Após o login, re-executa a verificação de admin
        const isPlatformAdmin = await checkPlatformAdminRole(data.user.id);
        setIsAdmin(isPlatformAdmin);

        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("E-mail ou senha incorretos");
      } else {
        toast.error(error.message || "Erro ao fazer login");
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        if (error.message.includes("Auth session missing")) {
          console.warn("Sign out attempted but session already missing. Treating as successful logout.");
        } else {
          throw error;
        }
      }

      setUser(null);
      setSession(null);
      setIsAdmin(false); // Limpa o estado de admin

      toast.success("Logout realizado com sucesso!");

    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer logout");
      throw error;
    }
  };

  const deleteUser = async () => {
    if (!user) {
      throw new Error("Nenhum usuário logado para excluir.");
    }

    const { data, error } = await supabase.functions.invoke('delete-user', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: { userId: user.id }
    });

    if (error) {
      console.error("Edge Function Error:", error);
      throw new Error(data?.message || "Falha ao excluir usuário via Edge Function.");
    }

    await signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signIn, signOut, deleteUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
