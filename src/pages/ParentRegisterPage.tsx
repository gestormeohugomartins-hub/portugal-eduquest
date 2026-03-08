import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
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
    childEmails: [
      { email: "", schoolYear: "1" },
      { email: "", schoolYear: "1" },
      { email: "", schoolYear: "1" },
      { email: "", schoolYear: "1" },
      { email: "", schoolYear: "1" },
    ] as ChildEmail[],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      toast.error("A palavra-passe deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          display_name: formData.name,
          role: "parent",
        },
      },
    });

    if (error) {
      toast.error("Erro no registo: " + error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Update district
      await supabase.from("profiles").update({ district: formData.district as any }).eq("user_id", data.user.id);

      // Add authorized emails with school year
      const validEmails = formData.childEmails.filter(e => e.email.trim() !== "");
      if (validEmails.length > 0) {
        await supabase.from("authorized_emails").insert(
          validEmails.map(child => ({ 
            parent_id: data.user!.id, 
            email: child.email.trim().toLowerCase(),
            school_year: child.schoolYear as any,
          }))
        );
      }

      toast.success("Registo efetuado! Verifique o seu email para confirmar a conta.");
      navigate("/login");
    }
    setLoading(false);
  };

  const updateChildEmail = (index: number, field: keyof ChildEmail, value: string) => {
    const updated = [...formData.childEmails];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, childEmails: updated });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 parchment-bg">
      <div className="w-full max-w-lg game-border p-8 bg-card">
        <div className="text-center mb-6">
          <img src={logo} alt="EduQuest" className="w-24 mx-auto mb-3" />
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
            <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required minLength={6} className="mt-1" />
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
            <Label className="font-body font-semibold">Educandos autorizados (até 5)</Label>
            <p className="text-xs text-muted-foreground font-body">Indique o email e ano de escolaridade de cada educando</p>
            {formData.childEmails.map((child, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  type="email"
                  placeholder={`Email do educando ${i + 1}`}
                  value={child.email}
                  onChange={e => updateChildEmail(i, "email", e.target.value)}
                  className="flex-1"
                />
                <Select 
                  value={child.schoolYear} 
                  onValueChange={v => updateChildEmail(i, "schoolYear", v)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolYears.map(y => (
                      <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
