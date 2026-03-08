import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle, Shield } from "lucide-react";
import logo from "@/assets/logo.png";

const ParentResetStudentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentEmail = searchParams.get("student_email") || "";
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    // Check if we have a valid parent session and they're the guardian
    const checkAuthorization = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      // Get student profile by email
      const { data: studentProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", studentEmail)
        .single();

      if (!studentProfile) return;

      // Check if current user is the parent
      const { data: student } = await supabase
        .from("students")
        .select("parent_id, display_name")
        .eq("user_id", studentProfile.user_id)
        .single();

      if (student && student.parent_id === session.user.id) {
        setAuthorized(true);
        setStudentName(student.display_name);
      }
    };

    checkAuthorization();
  }, [studentEmail]);

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

    // Get student user ID
    const { data: studentProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", studentEmail)
      .single();

    if (!studentProfile) {
      toast.error("Aluno não encontrado");
      setLoading(false);
      return;
    }

    // Note: In production, this would use an admin function to update password
    // For now we'll use a workaround by sending a magic link
    const { error } = await supabase.auth.resetPasswordForEmail(studentEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      setSuccess(true);
      toast.success("Email enviado ao aluno para definir nova palavra-passe!");
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
          <h1 className="font-display text-2xl font-bold mb-2">Autorização Concedida!</h1>
          <p className="font-body text-muted-foreground mb-6">
            Enviámos um email para <strong>{studentEmail}</strong> com um link para definir a nova palavra-passe.
          </p>
          <Button onClick={() => navigate("/parent")} className="w-full bg-primary text-primary-foreground font-bold">
            Voltar ao Painel
          </Button>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 parchment-bg">
        <div className="w-full max-w-md game-border p-8 bg-card text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="font-body text-muted-foreground mb-6">
            Precisa de estar autenticado como encarregado de educação deste aluno para autorizar a recuperação de palavra-passe.
          </p>
          <Button onClick={() => navigate("/login")} className="w-full">
            Fazer Login
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
          <h1 className="font-display text-2xl font-bold">Autorizar Recuperação</h1>
          <p className="font-body text-sm text-muted-foreground mt-2">
            O aluno <strong>{studentName}</strong> pediu para recuperar a palavra-passe
          </p>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg mb-6">
          <p className="font-body text-sm text-muted-foreground">
            <Shield className="w-4 h-4 inline mr-1" />
            Como encarregado de educação, pode autorizar a recuperação da palavra-passe do seu educando.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold py-5" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                A processar...
              </>
            ) : (
              "Autorizar Recuperação de Palavra-passe"
            )}
          </Button>
        </form>
        
        <div className="mt-4 text-center">
          <Button variant="ghost" className="font-body text-muted-foreground" onClick={() => navigate("/parent")}>
            ← Cancelar e voltar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ParentResetStudentPage;
