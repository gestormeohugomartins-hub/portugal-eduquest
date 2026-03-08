import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error("Erro ao entrar: " + error.message);
    } else {
      // Check profile role to redirect
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (profile?.role === "parent") {
        navigate("/parent");
      } else {
        // Check if student needs placement test
        const { data: student } = await supabase
          .from("students")
          .select("*")
          .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
          .single();
        
        if (student && student.xp === 0) {
          navigate("/placement-test");
        } else {
          navigate("/game");
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 parchment-bg">
      <div className="w-full max-w-md game-border p-8 bg-card">
        <div className="text-center mb-6">
          <img src={logo} alt="Questeduca" className="w-32 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold">Continuar Aventura</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Entra na tua conta para continuar a jogar
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email" className="font-body font-semibold">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="o-teu@email.com"
              required
              className="mt-1"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="font-body font-semibold">Palavra-passe</Label>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline font-body">
                Esqueci-me da palavra-passe
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold text-lg py-5" disabled={loading}>
            {loading ? "A entrar..." : "⚔️ Entrar"}
          </Button>
        </form>


        <div className="mt-6 text-center">
          <p className="font-body text-sm text-muted-foreground mb-2">
            Ainda não tens conta?
          </p>
          <Link to="/register">
            <Button variant="link" className="font-body text-primary">
              Criar nova conta
            </Button>
          </Link>
        </div>
        
        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-muted-foreground underline font-body">
            ← Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
