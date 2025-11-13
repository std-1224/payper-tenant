import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface GlobalAdmin {
  id: string;
  user_id: string;
  role: 'super_admin' | 'support_admin' | 'sales_admin' | 'read_only';
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  globalAdmin: GlobalAdmin | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [globalAdmin, setGlobalAdmin] = useState<GlobalAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch global admin role separately
  const fetchGlobalAdmin = async (userId: string) => {
    // Prefer calling the SECURITY DEFINER function to avoid any RLS pitfalls
    const { data: role, error: roleError } = await supabase.rpc('current_global_role');

    if (roleError) {
      console.error('Error calling current_global_role():', roleError);
    }

    if (role) {
      // Synthesize a minimal GlobalAdmin object
      const ga: GlobalAdmin = {
        id: 'by-function',
        user_id: userId,
        role: role as GlobalAdmin['role'],
        is_active: true,
      };
      setGlobalAdmin(ga);
      return ga;
    }

    // Fallback: direct select (should work, but keep as backup)
    const { data, error } = await supabase
      .from('global_admins')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      // Helpful for debugging RLS/permissions issues
      console.error('Error fetching global_admins:', error);
    }

    setGlobalAdmin(data);
    return data;
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer database calls to avoid blocking
        if (session?.user) {
          setLoading(true);
          setTimeout(() => {
            fetchGlobalAdmin(session.user!.id).finally(() => setLoading(false));
          }, 0);
        } else {
          setGlobalAdmin(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchGlobalAdmin(session.user.id).then(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <AuthContext.Provider
      value={{ user, session, globalAdmin, loading, signIn, signUp, signOut }}
    >
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
