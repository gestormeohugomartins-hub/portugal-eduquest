import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

const StudentRegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", gender: "indefinido", schoolYear: "1",
  });
  const [loading, setLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "authorized" | "not_authorized">("idle");
  const [authorizedEmail, setAuthorizedEmail] = useState<any>(null);

  const checkEmailAuthorization = useCallback(async (email: string) => {
    if (!email || !email.includes("@")) {
      setEmailStatus("idle");
      return;
    }
    
    setEmailStatus("checking");
    
    const { data } = await supabase
      .from("authorized_emails")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .eq("used", false)
      .single();

    if (data) {
      setEmailStatus("authorized");
      setAuthorizedEmail(data);
      // Auto-fill school year from authorized email
      setFormData(prev => ({ ...prev, schoolYear: data.school_year || "1" }));
    } else {
      setEmailStatus("not_authorized");
      setAuthorizedEmail(null);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (emailStatus !== "authorized" || !authorizedEmail) {
      toast.error("O email deve estar autorizado por um encarregado de educação");
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error("A palavra-passe deve ter pelo menos 6 caracteres");
      return;
    }
    
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
      options: {
        data: {
          display_name: formData.name,
          role: "student",
        },
      },
    });

    if (error) {
      toast.error("Erro no registo: " + error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Get parent's district
      const { data: parentProfile } = await supabase
        .from("profiles")
        .select("district")
        .eq("user_id", authorizedEmail.parent_id)
        .single();

      // Create student record with gender and school year from authorized email
      await supabase.from("students").insert({
        user_id: data.user.id,
        parent_id: authorizedEmail.parent_id,
        display_name: formData.name,
        school_year: formData.schoolYear as any,
        district: parentProfile?.district as any,
        gender: formData.gender,
      });

      // Mark email as used
      await supabase.from("authorized_emails").update({ used: true }).eq("id", authorizedEmail.id);

      // Update profile role
      await supabase.from("profiles").update({ role: "student" as any }).eq("user_id", data.user.id);

      toast.success("Registo efetuado! Verifica o teu email para confirmar a conta.");
      navigate("/login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 parchment-bg">
      <div className="w-full max-w-md game-border p-8 bg-card">
        <div className="text-center mb-6">
          <img src={logo} alt="Questeduca" className="w-24 mx-auto mb-3" />
          <h1 className="font-display text-2xl font-bold">Registo de Aluno</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Preenche os teus dados para começar a jogar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="font-body font-semibold">Nome</Label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="O teu nome"
              required 
              className="mt-1" 
            />
          </div>
          
          <div>
            <Label className="font-body font-semibold">Email (autorizado pelo encarregado)</Label>
            <div className="relative mt-1">
              <Input 
                type="email" 
                value={formData.email} 
                onChange={e => {
                  setFormData({...formData, email: e.target.value});
                  setEmailStatus("idle");
                }}
                onBlur={e => checkEmailAuthorization(e.target.value)}
                placeholder="o-teu@email.com"
                required 
                className={`pr-10 ${
                  emailStatus === "authorized" ? "border-green-500 focus-visible:ring-green-500" : 
                  emailStatus === "not_authorized" ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {emailStatus === "checking" && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                {emailStatus === "authorized" && <CheckCircle className="w-5 h-5 text-green-500" />}
                {emailStatus === "not_authorized" && <XCircle className="w-5 h-5 text-destructive" />}
              </div>
            </div>
            {emailStatus === "authorized" && (
              <p className="text-sm text-green-600 mt-1 font-body">✓ Email autorizado! Podes continuar.</p>
            )}
            {emailStatus === "not_authorized" && (
              <p className="text-sm text-destructive mt-1 font-body">
                Este email não está autorizado. Pede ao teu encarregado de educação para o registar.
              </p>
            )}
          </div>
          
          <div>
            <Label className="font-body font-semibold">Palavra-passe</Label>
            <Input 
              type="password" 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              placeholder="Mínimo 6 caracteres"
              required 
              minLength={6} 
              className="mt-1" 
            />
          </div>
          
          <div>
            <Label className="font-body font-semibold">Género</Label>
            <Select value={formData.gender} onValueChange={v => setFormData({...formData, gender: v})}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
                <SelectItem value="indefinido">Prefiro não dizer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary text-primary-foreground font-bold text-lg py-5" 
            disabled={loading || emailStatus !== "authorized"}
          >
            {loading ? "A registar..." : "⚔️ Registar"}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="font-body text-sm text-muted-foreground">
            Já tens conta?
          </p>
          <Link to="/login">
            <Button variant="link" className="font-body text-primary">
              Entrar na minha conta
            </Button>
          </Link>
        </div>
        
        <div className="mt-4 text-center">
          <Button variant="ghost" className="font-body text-muted-foreground" onClick={() => navigate("/register")}>
            ← Voltar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudentRegisterPage;
