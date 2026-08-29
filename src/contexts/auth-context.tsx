import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const lastUserId = useRef<string | null>(null);
  const [state, setState] = useState<AuthContextValue>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      lastUserId.current = user?.id ?? null;
      setState({ isAuthenticated: !!user, user: user ?? null, isLoading: false });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      const nextId = session?.user?.id ?? null;
      // On logout, or when a different reader signs in, drop every cached
      // server response so onboarding progress is re-read for the new session
      // instead of resuming from the previous account's state.
      if (nextId !== lastUserId.current) {
        queryClient.clear();
        lastUserId.current = nextId;
      }
      setState({
        isAuthenticated: !!session?.user,
        user: session?.user ?? null,
        isLoading: false,
      });
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [queryClient]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}


export function useAuth() {
  return useContext(AuthContext);
}
