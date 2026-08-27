import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  user: null,
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthContextValue>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setState({ isAuthenticated: !!user, user: user ?? null, isLoading: false });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setState({
        isAuthenticated: !!session?.user,
        user: session?.user ?? null,
        isLoading: false,
      });
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
