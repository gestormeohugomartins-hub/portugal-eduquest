import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const StudentRegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", schoolYear: "1",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      toast.error("A palavra-passe deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);

    // Check if email is authorized by a parent
    const { data: authorizedEmail } = await supabase
      .from("authorized_emails")
      .select("*")
      .eq("email", formData.email)
      .eq("used", false)
      .single();

    if (!authorizedEmail) {
      toast.error("Este email não foi autorizado por nenhum pai/encarregado de educação. Peça ao seu encarregado de educação para o registar primeiro.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
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

      // Create student record
      await supabase.from("students").insert({
        user_id: data.user.id,
        parent_id: authorizedEmail.parent_id,
        display_name: formData.name,
        school_year: formData.schoolYear as any,
        district: parentProfile?.district as any,
      });

      // Mark email as used
      await supabase.from("authorized_emails").update({ used: true }).eq("id", authorizedEmail.id);

      // Update profile role
      await supabase.from("profiles").update({ role: "student" as any }).eq("user_id", data.user.id);

      toast.success("Registo efetuado! Verifique o seu email para confirmar.");
      navigate("/login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 parchment-bg">
      <div className="w-full max-w-md game-border p-8 bg-card">
        <div className="text-center mb-6">
          <img src={logo} alt="EduQuest" className="w-24 mx-auto mb-3" />
          <h1 className="font-display text-2xl font-bold">Registo de Aluno</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            O teu pai/encarregado de educação deve ter registado o teu email primeiro
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="font-body font-semibold">Nome</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="mt-1" />
          </div>
          <div>
            <Label className="font-body font-semibold">Email (autorizado pelo encarregado)</Label>
            <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="mt-1" />
          </div>
          <div>
            <Label className="font-body font-semibold">Palavra-passe</Label>
            <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required minLength={6} className="mt-1" />
          </div>
          <div>
            <Label className="font-body font-semibold">Ano de escolaridade</Label>
            <Select value={formData.schoolYear} onValueChange={v => setFormData({...formData, schoolYear: v})}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1º Ano</SelectItem>
                <SelectItem value="2">2º Ano</SelectItem>
                <SelectItem value="3">3º Ano</SelectItem>
                <SelectItem value="4">4º Ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold text-lg py-5" disabled={loading}>
            {loading ? "A registar..." : "⚔️ Registar"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-accent underline font-body">Já tenho conta</Link>
        </div>
      </div>
    </div>
  );
};

export default StudentRegisterPage;
