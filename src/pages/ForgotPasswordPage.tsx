import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail, emailTemplates } from "@/lib/email";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [isStudent, setIsStudent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, find the profile by email
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .eq("email", email.toLowerCase().trim())
        .single();

      if (!profile) {
        toast.error("Email não encontrado");
        setLoading(false);
        return;
      }

      // Check if this email belongs to a student
      const { data: student } = await supabase
        .from("students")
        .select("id, parent_id, display_name")
        .eq("user_id", profile.user_id)
        .single();

      if (student) {
        // Student - get parent email and send notification to parent
        const { data: parentProfile } = await supabase
          .from("profiles")
          .select("email, display_name")
          .eq("user_id", student.parent_id)
          .single();

        if (parentProfile) {
          // Generate a recovery token via Supabase (for the actual reset)
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
            redirectTo: `${window.location.origin}/reset-password`,
          });

          if (resetError) {
            throw resetError;
          }

          // Send custom email to parent for authorization
          const approveLink = `${window.location.origin}/parent-reset-student?student_email=${encodeURIComponent(email)}&student_name=${encodeURIComponent(student.display_name)}`;
          const template = emailTemplates.parentStudentRecovery(student.display_name, approveLink);
          
          await sendEmail({
            to: parentProfile.email,
            subject: template.subject,
            html: template.html,
          });

          setIsStudent(true);
          setSent(true);
          toast.success("Email enviado ao encarregado de educação!");
        }
      } else {
        // Parent - direct password reset with custom email
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (resetError) {
          throw resetError;
        }

        // Send custom branded recovery email
        const resetLink = `${window.location.origin}/reset-password`;
        const template = emailTemplates.passwordRecovery(resetLink);
        
        await sendEmail({
          to: email.toLowerCase().trim(),
          subject: template.subject,
          html: template.html,
        });

        setSent(true);
        toast.success("Email de recuperação enviado!");
      }
    } catch (error: any) {
      console.error("Recovery error:", error);
      toast.error("Erro ao enviar email: " + (error.message || "Tenta novamente"));
    }

    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 parchment-bg">
        <div className="w-full max-w-md game-border p-8 bg-card text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Email Enviado!</h1>
          {isStudent ? (
            <p className="font-body text-muted-foreground mb-6">
              Enviámos um email ao teu encarregado de educação. Ele vai receber um link para 
              autorizar a redefinição da tua palavra-passe.
            </p>
          ) : (
            <p className="font-body text-muted-foreground mb-6">
              Verifica a tua caixa de entrada. Enviámos-te um link para redefinires a tua palavra-passe.
            </p>
          )}
          <Button onClick={() => navigate("/login")} className="w-full">
            Voltar ao Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 parchment-bg">
      <div className="w-full max-w-md game-border p-8 bg-card">
        <div className="text-center mb-6">
          <img src={logo} alt="Questeduca" className="w-24 mx-auto mb-3" />
          <h1 className="font-display text-2xl font-bold">Recuperar Palavra-passe</h1>
          <p className="font-body text-sm text-muted-foreground mt-2">
            Introduz o teu email e enviamos-te instruções para redefinir a palavra-passe
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="font-body font-semibold">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="o-teu@email.com"
              required
              className="mt-1"
            />
          </div>
          
          <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold py-5" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                A enviar...
              </>
            ) : (
              "Enviar Email de Recuperação"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login">
            <Button variant="ghost" className="font-body text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;