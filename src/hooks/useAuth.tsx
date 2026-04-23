import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "admin" | "landlord" | "tenant";

type RoleRow = {
  role: UserRole;
};

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
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
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

  // -----------------------------
  // FETCH USER DATA (ROLES + PROFILE)
  // -----------------------------
 const fetchUserData = async (userId: string) => {
  // -----------------------------
  // ROLES
  // -----------------------------
  const rolesRes = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (rolesRes.error) {
    console.error("Roles fetch error:", rolesRes.error);
  }

  const rolesData = rolesRes.data as unknown as { role: UserRole }[] | null;

  if (rolesData) {
    setRoles(rolesData.map((r) => r.role));
  }

  // -----------------------------
  // PROFILE
  // -----------------------------
  const profileRes = await supabase
    .from("profiles")
    .select("full_name, phone, avatar_url")
    .eq("user_id", userId)
    .single();

  if (profileRes.error) {
    console.error("Profile fetch error:", profileRes.error);
  }

  const profileData = profileRes.data as {
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;

  if (profileData) {
    setProfile(profileData);
  }
};

  // -----------------------------
  // INIT AUTH
  // -----------------------------
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // delay prevents race condition
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setRoles([]);
          setProfile(null);
        }

        setLoading(false);
      }
    );

    // initial session load
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(session.user.id);
      }

      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // -----------------------------
  // AUTH ACTIONS
  // -----------------------------
  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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
        signUp,
        signIn,
        signOut,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// -----------------------------
// HOOK
// -----------------------------
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}