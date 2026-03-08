import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: any | null;
  studentData: any | null;
  isParent: boolean;
  isStudent: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const initialized = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        setProfile(null);
        setStudentData(null);
        return;
      }
      
      setProfile(profileData);

      if (profileData?.role === "student") {
        const { data: student, error: studentError } = await supabase
          .from("students")
          .select("*")
          .eq("user_id", userId)
          .single();
        if (studentError) {
          console.error("Error fetching student:", studentError);
        }
        setStudentData(student ?? null);
      } else {
        setStudentData(null);
      }
    } catch (err) {
      console.error("fetchProfile exception:", err);
      setProfile(null);
      setStudentData(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    let cancelled = false;

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (cancelled) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id);
      }
      setLoading(false);
      initialized.current = true;
    });

    // Listen for auth changes AFTER initialization
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (cancelled) return;
        
        // Skip if not yet initialized to avoid race with getSession
        if (!initialized.current) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
          setStudentData(null);
        }
        setLoading(false);
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setStudentData(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        profile,
        studentData,
        isParent: profile?.role === "parent",
        isStudent: profile?.role === "student",
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
