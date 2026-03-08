import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/lib/googleAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
      // Update profile with district
      await supabase.from("profiles").update({ 
        district: formData.district as any,
      }).eq("user_id", data.user.id);

      // Add authorized child emails with school year
      const validEmails = formData.childEmails.filter(c => c.email.includes("@"));
      if (validEmails.length > 0) {
        await supabase.from("authorized_emails").insert(
          validEmails.map(c => ({
            parent_id: data.user!.id,
            email: c.email.toLowerCase().trim(),
            school_year: c.schoolYear as any,
          }))
        );
      }

      toast.success("Registo efetuado! Verifique o seu email para confirmar a conta.");
      navigate("/login");
    }
    setLoading(false);
  };

  const handleChildEmailChange = (index: number, field: 'email' | 'schoolYear', value: string) => {
    const updated = [...formData.childEmails];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, childEmails: updated });
  };

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle("/parent");
    if (error) toast.error("Erro com Google: " + (error as any).message);
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

        {/* Google Sign In */}
        <Button
          variant="outline"
          className="w-full font-body font-semibold py-5 border-2 mb-4"
          onClick={handleGoogleSignIn}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Registar com Google
        </Button>

        <div className="flex items-center gap-3 mb-4">
          <Separator className="flex-1" />
          <span className="font-body text-xs text-muted-foreground">ou</span>
          <Separator className="flex-1" />
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
                  onChange={e => handleChildEmailChange(i, 'email', e.target.value)}
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