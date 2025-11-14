import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
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
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
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
      console.error('Error fetching global_admins:', error);
    }

    // If no global_admin record found, try to create one automatically
    if (!data && !role) {
      console.log('No global_admin record found, attempting auto-creation...');
      try {
        const { error: createError } = await supabase.rpc('register_as_super_admin');
        if (!createError) {
          console.log('✅ Auto-created super_admin record');
          // Retry fetching the role
          const { data: retryRole } = await supabase.rpc('current_global_role');
          if (retryRole) {
            const ga: GlobalAdmin = {
              id: 'by-function',
              user_id: userId,
              role: retryRole as GlobalAdmin['role'],
              is_active: true,
            };
            setGlobalAdmin(ga);
            return ga;
          }
        } else {
          console.error('Failed to auto-create admin:', createError);
        }
      } catch (err) {
        console.error('Exception during auto-creation:', err);
      }
    }

    setGlobalAdmin(data);
    return data;
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
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
    const redirectUrl = `${window.location.origin}/admin/dashboard`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    // If signup successful, automatically register user as super_admin
    if (!error && data.user && data.session) {
      // Wait a moment for the session to be fully established
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        // Call the database function to add user to global_admins
        const { error: adminError } = await supabase.rpc('register_as_super_admin');

        if (adminError) {
          console.error('Error registering as super admin:', adminError);
          // Try alternative method with user_id
          const { error: altError } = await supabase.rpc('create_super_admin_for_user', {
            user_id_param: data.user.id
          });
          if (altError) {
            console.error('Alternative method also failed:', altError);
          }
        } else {
          console.log('✅ User successfully registered as super_admin');
        }
      } catch (err) {
        console.error('Exception registering as super admin:', err);
      }
    }

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
