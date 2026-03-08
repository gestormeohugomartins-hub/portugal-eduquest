import { useState } from "react";
import { validatePassword } from "@/lib/passwordValidation";
import { PasswordInput } from "@/components/PasswordInput";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import logo from "@/assets/logo.png";

const districts = [
  { value: "aveiro", label: "Aveiro" }, { value: "beja", label: "Beja" },
  { value: "braga", label: "Braga" }, { value: "braganca", label: "Bragança" },
  { value: "castelo_branco", label: "Castelo Branco" }, { value: "coimbra", label: "Coimbra" },
  { value: "evora", label: "Évora" }, { value: "faro", label: "Faro" },
  { value: "guarda", label: "Guarda" }, { value: "leiria", label: "Leiria" },
  { value: "lisboa", label: "Lisboa" }, { value: "portalegre", label: "Portalegre" },
  { value: "porto", label: "Porto" }, { value: "santarem", label: "Santarém" },
  { value: "setubal", label: "Setúbal" }, { value: "viana_castelo", label: "Viana do Castelo" },
  { value: "vila_real", label: "Vila Real" }, { value: "viseu", label: "Viseu" },
  { value: "acores", label: "Açores" }, { value: "madeira", label: "Madeira" },
];

const schoolYears = [
  { value: "1", label: "1º Ano" },
  { value: "2", label: "2º Ano" },
  { value: "3", label: "3º Ano" },
  { value: "4", label: "4º Ano" },
];

interface ChildEmail {
  email: string;
  schoolYear: string;
}

const ParentRegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", district: "",
  });
  const [childEmails, setChildEmails] = useState<ChildEmail[]>([
    { email: "", schoolYear: "1" },
  ]);
  const [loading, setLoading] = useState(false);

  const addChildEmail = () => {
    if (childEmails.length < 5) {
      setChildEmails([...childEmails, { email: "", schoolYear: "1" }]);
    }
  };

  const removeChildEmail = (index: number) => {
    if (childEmails.length > 1) {
      setChildEmails(childEmails.filter((_, i) => i !== index));
    }
  };

  const handleChildEmailChange = (index: number, field: 'email' | 'schoolYear', value: string) => {
    const updated = [...childEmails];
    updated[index] = { ...updated[index], [field]: value };
    setChildEmails(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!childEmails[0].email.includes("@")) {
      toast.error("Deve indicar pelo menos 1 email de educando válido");
      return;
    }

    const pwValidation = validatePassword(formData.password);
    if (!pwValidation.isValid) {
      toast.error("Palavra-passe insegura: " + pwValidation.errors[0]);
      return;
    }

    if (!formData.district) {
      toast.error("Deve selecionar um distrito");
      return;
    }

    setLoading(true);

    const validEmails = childEmails.filter(c => c.email.includes("@"));

    // Pass child emails and district in user metadata so the DB trigger handles them
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/email-verified`,
        data: {
          display_name: formData.name,
          role: "parent",
          district: formData.district,
          child_emails: validEmails,
        },
      },
    });

    if (error) {
      toast.error("Erro no registo: " + error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      toast.success("Registo efetuado! Verifique o seu email para confirmar a conta.");
      navigate("/login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 parchment-bg">
      <div className="w-full max-w-lg game-border p-8 bg-card">
        <div className="text-center mb-6">
          <img src={logo} alt="Questeduca" className="w-24 mx-auto mb-3" />
          <h1 className="font-display text-2xl font-bold">Registo de Pai/Enc. Educação</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Registe-se para que os seus educandos possam jogar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="font-body font-semibold">Nome completo</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="mt-1" />
          </div>
          <div>
            <Label className="font-body font-semibold">Email</Label>
            <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="mt-1" />
          </div>
          <div>
            <Label className="font-body font-semibold">Palavra-passe</Label>
            <div className="mt-1">
              <PasswordInput value={formData.password} onChange={v => setFormData({...formData, password: v})} />
            </div>
          </div>
          <div>
            <Label className="font-body font-semibold">Distrito</Label>
            <Select value={formData.district} onValueChange={v => setFormData({...formData, district: v})}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o distrito" /></SelectTrigger>
              <SelectContent>
                {districts.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-body font-semibold">Educandos autorizados</Label>
              {childEmails.length < 5 && (
                <Button type="button" variant="ghost" size="sm" onClick={addChildEmail} className="text-xs font-body gap-1">
                  <Plus className="w-3 h-3" /> Adicionar
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-body">
              Indique o email e ano de cada educando (mín. 1, máx. 5)
            </p>
            {childEmails.map((child, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  type="email"
                  placeholder={`Email do educando ${i + 1}`}
                  value={child.email}
                  onChange={e => handleChildEmailChange(i, 'email', e.target.value)}
                  required={i === 0}
                  className="flex-1"
                />
                <Select 
                  value={child.schoolYear} 
                  onValueChange={v => handleChildEmailChange(i, 'schoolYear', v)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolYears.map(y => (
                      <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {childEmails.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeChildEmail(i)} className="shrink-0 h-9 w-9 text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold text-lg py-5" disabled={loading}>
            {loading ? "A registar..." : "🏰 Registar"}
          </Button>
        </form>

        <div className="mt-4 flex flex-col items-center gap-2">
          <Button variant="ghost" className="w-full font-body text-muted-foreground" onClick={() => navigate("/register")}>
            ← Voltar
          </Button>
          <Link to="/login" className="text-sm text-accent underline font-body">Já tenho conta</Link>
        </div>
      </div>
    </div>
  );
};

export default ParentRegisterPage;
