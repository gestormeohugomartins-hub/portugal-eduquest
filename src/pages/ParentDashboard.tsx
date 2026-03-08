import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Users, BookOpen, MessageCircle, Shield, Settings, Plus, Trash2, MapPin, Save, Crown, Check, X } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const schoolYears = [
  { value: "1", label: "1º Ano" },
  { value: "2", label: "2º Ano" },
  { value: "3", label: "3º Ano" },
  { value: "4", label: "4º Ano" },
];

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

const districtLabels: Record<string, string> = {};
districts.forEach(d => { districtLabels[d.value] = d.label; });

const ParentDashboard = () => {
  const { user, profile, isParent, loading, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState<any[]>([]);
  const [authorizedEmails, setAuthorizedEmails] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newSchoolYear, setNewSchoolYear] = useState("1");
  const [addingEmail, setAddingEmail] = useState(false);
  const [editDistrict, setEditDistrict] = useState("");
  const [savingDistrict, setSavingDistrict] = useState(false);
  const [pendingFriendships, setPendingFriendships] = useState<any[]>([]);
  const [checkingOutChild, setCheckingOutChild] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setEditDistrict(profile.district || "");
    }
  }, [profile]);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
    if (!loading && user && !isParent) navigate("/game");
  }, [user, isParent, loading]);

  useEffect(() => {
    if (user) {
      loadChildren();
      loadAuthorizedEmails();
      loadPendingFriendships();
    }
  }, [user]);

  const loadChildren = async () => {
    const { data } = await supabase
      .from("students")
      .select("*")
      .eq("parent_id", user!.id);
    setChildren(data || []);
  };

  const loadAuthorizedEmails = async () => {
    const { data } = await supabase
      .from("authorized_emails")
      .select("*")
      .eq("parent_id", user!.id);
    setAuthorizedEmails(data || []);
  };

  const handleAddEmail = async () => {
    if (!newEmail.includes("@")) {
      toast.error("Email inválido");
      return;
    }

    const totalEmails = authorizedEmails.length;
    if (totalEmails >= 5) {
      toast.error("Máximo de 5 educandos autorizados");
      return;
    }

    setAddingEmail(true);
    const { error } = await supabase.from("authorized_emails").insert({
      parent_id: user!.id,
      email: newEmail.toLowerCase().trim(),
      school_year: newSchoolYear as any,
    });

    if (error) {
      toast.error("Erro ao adicionar email: " + error.message);
    } else {
      toast.success("Email autorizado adicionado!");
      setNewEmail("");
      setNewSchoolYear("1");
      loadAuthorizedEmails();
    }
    setAddingEmail(false);
  };

  const handleRemoveEmail = async (id: string, used: boolean) => {
    if (used) {
      toast.error("Não pode remover um email já registado");
      return;
    }
    const { error } = await supabase.from("authorized_emails").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover email");
    } else {
      toast.success("Email removido");
      loadAuthorizedEmails();
    }
  };

  const handleSaveDistrict = async () => {
    if (!editDistrict) {
      toast.error("Selecione um distrito");
      return;
    }
    setSavingDistrict(true);
    const { error } = await supabase
      .from("profiles")
      .update({ district: editDistrict as any })
      .eq("user_id", user!.id);
    if (error) {
      toast.error("Erro ao guardar distrito: " + error.message);
    } else {
      toast.success("Distrito atualizado!");
      await refreshProfile();
    }
    setSavingDistrict(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center parchment-bg">
        <p className="font-display text-xl">A carregar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen parchment-bg">
      {/* Header */}
      <div className="bg-card border-b-2 border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Questeduca" className="w-10 h-10" />
            <div>
              <h1 className="font-display text-lg font-bold">Painel Parental</h1>
              <p className="font-body text-xs text-muted-foreground">{profile?.display_name}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        <Tabs defaultValue="children">
          <TabsList className="w-full grid grid-cols-4 mb-6">
            <TabsTrigger value="children" className="font-body text-xs">
              <Users className="w-4 h-4 mr-1" /> Educandos
            </TabsTrigger>
            <TabsTrigger value="progress" className="font-body text-xs">
              <BookOpen className="w-4 h-4 mr-1" /> Progresso
            </TabsTrigger>
            <TabsTrigger value="social" className="font-body text-xs">
              <MessageCircle className="w-4 h-4 mr-1" /> Social
            </TabsTrigger>
            <TabsTrigger value="settings" className="font-body text-xs">
              <Settings className="w-4 h-4 mr-1" /> Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="children">
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold">Os Seus Educandos</h2>
              
              {children.length === 0 ? (
                <div className="game-border bg-card p-6 text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-body text-muted-foreground">
                    Nenhum educando registado ainda.
                  </p>
                  <p className="font-body text-sm text-muted-foreground mt-2">
                    Os seus educandos precisam registar-se com um dos emails autorizados.
                  </p>
                </div>
              ) : (
                children.map(child => (
                  <div key={child.id} className="game-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-body font-bold">{child.display_name}</h3>
                        {child.nickname && (
                          <p className="font-body text-xs text-primary">🎮 {child.nickname}</p>
                        )}
                        <p className="font-body text-sm text-muted-foreground">
                          {child.school_year}º Ano • Nível {child.village_level}
                        </p>
                      </div>
                      <div className="flex gap-2 text-xs font-body">
                        <span className="bg-gold/20 px-2 py-1 rounded">🪙 {child.coins}</span>
                        <span className="bg-diamond/20 px-2 py-1 rounded">💎 {child.diamonds}</span>
                        <span className="bg-citizen/20 px-2 py-1 rounded">👥 {child.citizens}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Authorized Emails */}
              <div className="mt-6">
                <h3 className="font-display text-lg font-bold mb-3">Emails Autorizados</h3>
                
                {authorizedEmails.length === 0 ? (
                  <p className="font-body text-sm text-muted-foreground">Nenhum email autorizado.</p>
                ) : (
                  <div className="space-y-2">
                    {authorizedEmails.map(ae => (
                      <div key={ae.id} className="flex items-center justify-between bg-card rounded-lg p-3 border border-border">
                        <div>
                          <span className="font-body text-sm">{ae.email}</span>
                          <span className="font-body text-xs text-muted-foreground ml-2">({ae.school_year}º Ano)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-body px-2 py-1 rounded ${ae.used ? "bg-secondary/20 text-secondary" : "bg-primary/20 text-primary"}`}>
                            {ae.used ? "Registado" : "Pendente"}
                          </span>
                          {!ae.used && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveEmail(ae.id, ae.used)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new authorized email */}
                {authorizedEmails.length < 5 && (
                  <div className="mt-4 p-4 border border-dashed border-border rounded-lg">
                    <Label className="font-body font-semibold text-sm">Adicionar educando</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="email"
                        placeholder="Email do educando"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        className="flex-1"
                      />
                      <Select value={newSchoolYear} onValueChange={setNewSchoolYear}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {schoolYears.map(y => (
                            <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleAddEmail} disabled={addingEmail} size="sm" className="shrink-0">
                        <Plus className="w-4 h-4 mr-1" /> Adicionar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="progress">
            <div className="game-border bg-card p-6 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-accent" />
              <h2 className="font-display text-xl font-bold mb-2">Evolução Escolar</h2>
              <p className="font-body text-muted-foreground">
                Acompanhe o desempenho dos seus educandos por disciplina.
              </p>
              {children.map(child => (
                <div key={child.id} className="mt-4 parchment-bg rounded-lg p-4 text-left">
                  <h3 className="font-body font-bold">{child.display_name}</h3>
                  <p className="font-body text-sm text-muted-foreground">
                    XP Total: {child.xp} • {child.school_year}º Ano
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="social">
            <div className="game-border bg-card p-6 text-center">
              <Shield className="w-12 h-12 mx-auto mb-3 text-secondary" />
              <h2 className="font-display text-xl font-bold mb-2">Controlo Social</h2>
              <p className="font-body text-muted-foreground">
                Gerir amizades e monitorizar conversas dos seus educandos.
              </p>
              <p className="font-body text-sm text-muted-foreground mt-4">
                Os pedidos de amizade dos seus educandos aparecerão aqui para aprovação.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="game-border bg-card p-6">
              <h2 className="font-display text-xl font-bold mb-4">Configurações</h2>
              <div className="space-y-4">
                <div className="parchment-bg rounded-lg p-4">
                  <h3 className="font-body font-bold mb-2">Prioridade de Disciplinas</h3>
                  <p className="font-body text-sm text-muted-foreground">
                    Defina qual disciplina deve ter mais incidência nas perguntas dos seus educandos.
                  </p>
                  <p className="font-body text-xs text-muted-foreground mt-2">
                    (As perguntas não ficam exclusivas — apenas com maior incidência)
                  </p>
                </div>
                <div className="parchment-bg rounded-lg p-4">
                  <h3 className="font-body font-bold mb-2">Informações da Conta</h3>
                  <p className="font-body text-sm text-muted-foreground mb-3">
                    Email: {profile?.email}
                  </p>
                  <div>
                    <Label className="font-body font-semibold text-sm flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> Distrito
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Select value={editDistrict} onValueChange={setEditDistrict}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione o distrito" />
                        </SelectTrigger>
                        <SelectContent>
                          {districts.map(d => (
                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={handleSaveDistrict} 
                        disabled={savingDistrict || editDistrict === (profile?.district || "")} 
                        size="sm"
                      >
                        <Save className="w-4 h-4 mr-1" /> Guardar
                      </Button>
                    </div>
                    <p className="font-body text-xs text-muted-foreground mt-1">
                      O distrito determina a localização no mapa e os monumentos do jogo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ParentDashboard;
