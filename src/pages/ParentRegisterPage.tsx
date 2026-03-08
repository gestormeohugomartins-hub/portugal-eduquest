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

const ParentRegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", district: "",
    childEmails: ["", "", "", "", ""],
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

      // Add authorized emails
      const validEmails = formData.childEmails.filter(e => e.trim() !== "");
      if (validEmails.length > 0) {
        await supabase.from("authorized_emails").insert(
          validEmails.map(email => ({ parent_id: data.user!.id, email: email.trim() }))
        );
      }

      toast.success("Registo efetuado! Verifique o seu email para confirmar a conta.");
      navigate("/login");
    }
    setLoading(false);
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

          <div className="space-y-2">
            <Label className="font-body font-semibold">Emails autorizados dos educandos (até 5)</Label>
            <p className="text-xs text-muted-foreground font-body">Estes emails poderão registar-se como alunos</p>
            {formData.childEmails.map((email, i) => (
              <Input
                key={i}
                type="email"
                placeholder={`Email do educando ${i + 1} (opcional)`}
                value={email}
                onChange={e => {
                  const updated = [...formData.childEmails];
                  updated[i] = e.target.value;
                  setFormData({...formData, childEmails: updated});
                }}
              />
            ))}
          </div>

          <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold text-lg py-5" disabled={loading}>
            {loading ? "A registar..." : "🏰 Registar"}
          </Button>
        </form>

        <div className="mt-4 flex flex-col items-center gap-2">
          <Button variant="ghost" className="w-full font-body text-muted-foreground" onClick={() => navigate("/login")}>
            ← Cancelar e voltar
          </Button>
          <Link to="/login" className="text-sm text-accent underline font-body">Já tenho conta</Link>
        </div>
      </div>
    </div>
  );
};

export default ParentRegisterPage;
