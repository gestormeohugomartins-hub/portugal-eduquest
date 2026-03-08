import { useState, useCallback } from "react";
import { validatePassword } from "@/lib/passwordValidation";
import { PasswordInput } from "@/components/PasswordInput";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail, emailTemplates } from "@/lib/email";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

const districtLabels: Record<string, string> = {
  aveiro: "Aveiro", beja: "Beja", braga: "Braga", braganca: "Bragança",
  castelo_branco: "Castelo Branco", coimbra: "Coimbra", evora: "Évora",
  faro: "Faro", guarda: "Guarda", leiria: "Leiria", lisboa: "Lisboa",
  portalegre: "Portalegre", porto: "Porto", santarem: "Santarém",
  setubal: "Setúbal", viana_castelo: "Viana do Castelo", vila_real: "Vila Real",
  viseu: "Viseu", acores: "Açores", madeira: "Madeira",
};

const StudentRegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", nickname: "", email: "", password: "", gender: "indefinido", schoolYear: "1", schoolId: "",
  });
  const [loading, setLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "authorized" | "not_authorized">("idle");
  const [authorizedEmail, setAuthorizedEmail] = useState<any>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [parentDistrict, setParentDistrict] = useState<string | null>(null);

  const loadSchools = async (district: string) => {
    const { data } = await supabase
      .from("schools")
      .select("*")
      .eq("district", district)
      .order("name");
    setSchools(data || []);
  };

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
      setFormData(prev => ({ ...prev, schoolYear: data.school_year || "1" }));
      
      const { data: parentProfile } = await supabase
        .from("profiles")
        .select("district")
        .eq("user_id", data.parent_id)
        .single();
      
      if (parentProfile?.district) {
        setParentDistrict(parentProfile.district as string);
        loadSchools(parentProfile.district as string);
      }
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

    if (!formData.nickname.trim()) {
      toast.error("Deves escolher um nickname para o jogo");
      return;
    }
    
    const pwValidation = validatePassword(formData.password);
    if (!pwValidation.isValid) {
      toast.error("Palavra-passe insegura: " + pwValidation.errors[0]);
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
      const { data: parentProfile } = await supabase
        .from("profiles")
        .select("district")
        .eq("user_id", authorizedEmail.parent_id)
        .single();

      await supabase.from("students").insert({
        user_id: data.user.id,
        parent_id: authorizedEmail.parent_id,
        display_name: formData.name,
        nickname: formData.nickname.trim(),
        school_year: formData.schoolYear as any,
        district: parentProfile?.district as any,
        gender: formData.gender,
        school_id: formData.schoolId || null,
      } as any);

      await supabase.from("authorized_emails").update({ used: true }).eq("id", authorizedEmail.id);
      await supabase.from("profiles").update({ role: "student" as any }).eq("user_id", data.user.id);

      try {
        const welcomeTemplate = emailTemplates.welcome(formData.name);
        await sendEmail({
          to: formData.email.toLowerCase().trim(),
          subject: welcomeTemplate.subject,
          html: welcomeTemplate.html,
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }

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
            <Label className="font-body font-semibold">Nome completo</Label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="O teu nome verdadeiro"
              required 
              className="mt-1" 
            />
          </div>

          <div>
            <Label className="font-body font-semibold">Nickname (nome no jogo)</Label>
            <Input 
              value={formData.nickname} 
              onChange={e => setFormData({...formData, nickname: e.target.value})} 
              placeholder="Ex: SuperCavaleiro, PresidenteMax..."
              required 
              className="mt-1" 
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground font-body mt-1">
              Este será o teu nome de presidente e como os outros jogadores te vão encontrar.
            </p>
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

          {schools.length > 0 && (
            <div>
              <Label className="font-body font-semibold">
                Escola {parentDistrict ? `(${districtLabels[parentDistrict] || parentDistrict})` : ""}
              </Label>
              <Input
                placeholder="Pesquisar escola..."
                value={schoolSearch}
                onChange={e => setSchoolSearch(e.target.value)}
                className="mt-1 mb-2"
              />
              <Select value={formData.schoolId} onValueChange={v => setFormData({...formData, schoolId: v})}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleciona a tua escola" /></SelectTrigger>
                <SelectContent className="max-h-48">
                  {schools
                    .filter(s => s.name.toLowerCase().includes(schoolSearch.toLowerCase()) || 
                                 (s.municipality || "").toLowerCase().includes(schoolSearch.toLowerCase()))
                    .map(school => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name} — {school.municipality}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-primary text-primary-foreground font-bold text-lg py-5" 
            disabled={loading || emailStatus !== "authorized"}
          >
            {loading ? "A registar..." : "⚔️ Registar"}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="font-body text-sm text-muted-foreground">Já tens conta?</p>
          <Link to="/login">
            <Button variant="link" className="font-body text-primary">Entrar na minha conta</Button>
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
