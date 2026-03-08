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
