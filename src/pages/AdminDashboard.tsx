import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Users, School, ShieldCheck, BarChart3, Building2 } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const AdminDashboard = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [associations, setAssociations] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalStudents: 0, totalParents: 0, totalAssociations: 0 });

  // Simple admin check - in production use a proper admin role
  const isAdmin = profile?.role === "parent" && profile?.email === "info@serv2all.pt";

  useEffect(() => {
    if (!loading && !user) navigate("/login");
    if (!loading && user && !isAdmin) {
      toast.error("Acesso restrito a administradores.");
      navigate("/");
    }
  }, [user, loading, isAdmin]);

  useEffect(() => {
    if (user && isAdmin) {
      loadData();
    }
  }, [user, isAdmin]);

  const loadData = async () => {
    const [assocRes, studentsRes, parentsRes] = await Promise.all([
      supabase.from("parent_associations").select("*").order("created_at", { ascending: false }),
      supabase.from("students").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("role", "parent").order("created_at", { ascending: false }),
    ]);

    setAssociations(assocRes.data || []);
    setStudents(studentsRes.data || []);
    setParents(parentsRes.data || []);
    setStats({
      totalStudents: studentsRes.data?.length || 0,
      totalParents: parentsRes.data?.length || 0,
      totalAssociations: assocRes.data?.length || 0,
    });
  };

  const handleAssociationStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("parent_associations")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar estado.");
    } else {
      toast.success(`Associação ${status === "approved" ? "aprovada" : "rejeitada"}.`);
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-display text-xl">A carregar...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b-2 border-border px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Questeduca" className="w-10 h-10" />
            <div>
              <h1 className="font-display text-lg font-bold">Painel Administração</h1>
              <p className="font-body text-xs text-muted-foreground">Questeduca Admin</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Alunos", value: stats.totalStudents, icon: Users, color: "bg-primary/10 text-primary" },
            { label: "Pais", value: stats.totalParents, icon: ShieldCheck, color: "bg-secondary/10 text-secondary" },
            { label: "Associações", value: stats.totalAssociations, icon: Building2, color: "bg-accent/10 text-accent" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${s.color}`}>
                <s.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-body text-2xl font-bold">{s.value}</p>
                <p className="font-body text-sm text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="associations">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="associations" className="font-body text-xs">
              <Building2 className="w-4 h-4 mr-1" /> Associações
            </TabsTrigger>
            <TabsTrigger value="students" className="font-body text-xs">
              <Users className="w-4 h-4 mr-1" /> Alunos
            </TabsTrigger>
            <TabsTrigger value="parents" className="font-body text-xs">
              <ShieldCheck className="w-4 h-4 mr-1" /> Pais
            </TabsTrigger>
          </TabsList>

          <TabsContent value="associations">
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold">Associações de Pais</h2>
              {associations.length === 0 ? (
                <p className="font-body text-muted-foreground">Nenhuma associação registada.</p>
              ) : (
                associations.map((a) => (
                  <div key={a.id} className="bg-card rounded-xl border border-border p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-body font-bold">{a.name}</h3>
                        <p className="font-body text-sm text-muted-foreground">
                          Presidente: {a.president_name} • Código: {a.association_code}
                        </p>
                        <p className="font-body text-sm text-muted-foreground">
                          Email: {a.email} • IBAN: {a.iban || "N/D"}
                        </p>
                        <p className="font-body text-xs text-muted-foreground mt-1">
                          Total angariado: €{(a.total_raised / 100).toFixed(2)} • Total pago: €{(a.total_paid / 100).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-body px-2 py-1 rounded ${
                          a.status === "approved" ? "bg-green-100 text-green-700" :
                          a.status === "rejected" ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {a.status === "approved" ? "Aprovada" : a.status === "rejected" ? "Rejeitada" : "Pendente"}
                        </span>
                        {a.status === "pending" && (
                          <>
                            <Button size="sm" onClick={() => handleAssociationStatus(a.id, "approved")} className="bg-green-600 text-white text-xs">
                              Aprovar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleAssociationStatus(a.id, "rejected")} className="text-xs">
                              Rejeitar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="students">
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold">Alunos Registados</h2>
              {students.length === 0 ? (
                <p className="font-body text-muted-foreground">Nenhum aluno registado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full font-body text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="p-2">Nome</th>
                        <th className="p-2">Ano</th>
                        <th className="p-2">Nível</th>
                        <th className="p-2">XP</th>
                        <th className="p-2">Premium</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => (
                        <tr key={s.id} className="border-b border-border/50">
                          <td className="p-2 font-semibold">{s.display_name}</td>
                          <td className="p-2">{s.school_year}º</td>
                          <td className="p-2">{s.village_level}</td>
                          <td className="p-2">{s.xp}</td>
                          <td className="p-2">{s.is_premium ? "✅" : "❌"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="parents">
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold">Pais Registados</h2>
              {parents.length === 0 ? (
                <p className="font-body text-muted-foreground">Nenhum pai registado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full font-body text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="p-2">Nome</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Distrito</th>
                        <th className="p-2">Desde</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parents.map((p) => (
                        <tr key={p.id} className="border-b border-border/50">
                          <td className="p-2 font-semibold">{p.display_name}</td>
                          <td className="p-2">{p.email}</td>
                          <td className="p-2">{p.district || "N/D"}</td>
                          <td className="p-2">{new Date(p.created_at).toLocaleDateString("pt-PT")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
