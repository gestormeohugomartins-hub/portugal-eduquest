import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { resolvePostLoginRoute } from "@/lib/authNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";
import logo from "@/assets/logo.png";

const EmailVerifiedPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Listen for auth state changes from the verification token
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const userEmail = session.user.email || "";
          setEmail(userEmail);
          setVerified(true);

          // Fetch user display name
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", session.user.id)
            .single();

          if (profile?.display_name) {
            setUserName(profile.display_name);
          }

          // Sign out so user can log in with password
          await supabase.auth.signOut();
        }
      }
    );

    // Check if there's a hash fragment with access_token (email verification callback)
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token")) {
      // No verification token, redirect to login
      navigate("/login");
    }

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        toast.error("Erro ao entrar: " + error.message);
        return;
      }

      if (!data.user) {
        toast.error("Sessão inválida. Tenta novamente.");
        return;
      }

      const targetRoute = await resolvePostLoginRoute(data.user);
      navigate(targetRoute);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 parchment-bg">
      <div className="w-full max-w-md game-border p-8 bg-card">
        <div className="text-center mb-6">
          <img src={logo} alt="Questeduca" className="w-28 mx-auto mb-4" />

          {verified ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="font-display text-2xl font-bold text-green-600">
                Email Verificado! ✅
              </h1>
              <p className="font-body text-base text-foreground mt-2 font-semibold">
                {userName ? `Utilizador ${userName} validado com sucesso!` : "Conta validada com sucesso!"}
              </p>
              <p className="font-body text-sm text-muted-foreground mt-1">
                Introduz a tua palavra-passe para entrar
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold">A verificar email...</h1>
              <p className="font-body text-sm text-muted-foreground mt-1">
                Aguarda um momento...
              </p>
            </>
          )}
        </div>

        {verified && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="font-body font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                readOnly
                disabled
                className="mt-1 bg-muted cursor-not-allowed"
              />
            </div>
            <div>
              <Label htmlFor="password" className="font-body font-semibold">Palavra-passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="A tua palavra-passe"
                required
                className="mt-1"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground font-bold text-lg py-5"
              disabled={loading}
            >
              {loading ? "A entrar..." : "⚔️ Entrar na aventura"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default EmailVerifiedPage;
