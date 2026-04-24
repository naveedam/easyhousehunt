import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "admin" | "landlord" | "tenant";

interface Profile {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: UserRole[];
  profile: Profile | null;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchUserData = async (userId: string) => {
    const rolesRes: any = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const profileRes: any = await supabase
      .from("profiles")
      .select("full_name, phone, avatar_url")
      .eq("user_id", userId)
      .single();

    if (rolesRes?.data) {
      setRoles(rolesRes.data.map((r: any) => r.role));
    }

    if (profileRes?.data) {
      setProfile(profileRes.data);
    }
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("🔐 AUTH EVENT:", _event);

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log("✅ LOGGED IN USER:", session.user.email);

          await fetchUserData(session.user.id);
        } else {
          setRoles([]);
          setProfile(null);
        }

        setLoading(false);
      }
    );

    supabase.auth.getSession().then((res: any) => {
      const session = res?.data?.session;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        console.log("♻️ RESTORED USER:", session.user.email);

        fetchUserData(session.user.id);
      }

      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasRole = (role: UserRole) => roles.includes(role);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        roles,
        profile,
        signOut,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}