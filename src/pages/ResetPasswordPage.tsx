import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import logo from "@/assets/logo.png";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      } else {
        // Check hash for recovery type
        const hash = window.location.hash;
        if (hash.includes("type=recovery")) {
          setIsValidSession(true);
        }
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("As palavras-passe não coincidem");
      return;
    }
    
    if (password.length < 6) {
      toast.error("A palavra-passe deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error("Erro ao atualizar palavra-passe: " + error.message);
    } else {
      setSuccess(true);
      toast.success("Palavra-passe atualizada com sucesso!");
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 parchment-bg">
        <div className="w-full max-w-md game-border p-8 bg-card text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Palavra-passe Atualizada!</h1>
          <p className="font-body text-muted-foreground mb-6">
            A tua palavra-passe foi alterada com sucesso. Já podes entrar na tua conta.
          </p>
          <Button onClick={() => navigate("/login")} className="w-full bg-primary text-primary-foreground font-bold">
            Ir para Login
          </Button>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 parchment-bg">
        <div className="w-full max-w-md game-border p-8 bg-card text-center">
          <h1 className="font-display text-2xl font-bold mb-2">Link Inválido</h1>
          <p className="font-body text-muted-foreground mb-6">
            Este link de recuperação expirou ou é inválido. Por favor, solicita um novo.
          </p>
          <Button onClick={() => navigate("/forgot-password")} className="w-full">
            Solicitar Novo Link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 parchment-bg">
      <div className="w-full max-w-md game-border p-8 bg-card">
        <div className="text-center mb-6">
          <img src={logo} alt="EduQuest" className="w-24 mx-auto mb-3" />
          <h1 className="font-display text-2xl font-bold">Nova Palavra-passe</h1>
          <p className="font-body text-sm text-muted-foreground mt-2">
            Escolhe uma nova palavra-passe segura
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="font-body font-semibold">Nova Palavra-passe</Label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="font-body font-semibold">Confirmar Palavra-passe</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repete a palavra-passe"
              required
              minLength={6}
              className="mt-1"
            />
          </div>
          
          <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold py-5" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                A atualizar...
              </>
            ) : (
              "Atualizar Palavra-passe"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
