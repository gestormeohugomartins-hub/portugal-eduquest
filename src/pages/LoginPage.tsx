import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
          <img src={logo} alt="EduQuest" className="w-32 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold">Entrar no Jogo</h1>
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
            <Label htmlFor="password" className="font-body font-semibold">Palavra-passe</Label>
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

        <div className="my-4 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="font-body text-xs text-muted-foreground">ou</span>
          <Separator className="flex-1" />
        </div>

        <Button
          variant="outline"
          className="w-full font-body font-semibold py-5 border-2"
          onClick={async () => {
            const { error } = await lovable.auth.signInWithOAuth("google", {
              redirect_uri: window.location.origin,
            });
            if (error) toast.error("Erro com Google: " + error.message);
          }}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Entrar com Google
        </Button>

        <div className="mt-6 text-center space-y-2">
          <p className="font-body text-sm text-muted-foreground">
            Ainda não tens conta?
          </p>
          <div className="flex flex-col gap-2">
            <Link to="/register/parent">
              <Button variant="outline" className="w-full font-body">
                Registar como Pai/Enc. Educação
              </Button>
            </Link>
            <Link to="/register/student">
              <Button variant="outline" className="w-full font-body">
                Registar como Aluno
              </Button>
            </Link>
          </div>
          <Link to="/" className="text-sm text-accent underline font-body">
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
