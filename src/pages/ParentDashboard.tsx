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
import { PremiumModal } from "@/components/game/PremiumModal";
import { AccessibilityWrapper } from "@/components/accessibility/AccessibilityWrapper";
import { AccessibilitySettings } from "@/components/accessibility/AccessibilitySettings";
import { ChatMonitor } from "@/components/parent/ChatMonitor";
import { SubjectPriorityManager } from "@/components/parent/SubjectPriorityManager";

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
  const [premiumChild, setPremiumChild] = useState<any>(null);

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
  const loadPendingFriendships = async () => {
    if (!user) return;
    // Get all children IDs
    const { data: kids } = await supabase
      .from("students")
      .select("id, display_name, nickname")
      .eq("parent_id", user.id);
    if (!kids || kids.length === 0) return;

    const kidIds = kids.map(k => k.id);
    const kidMap = new Map(kids.map(k => [k.id, k]));

    // Get all pending friendships involving my children
    const { data: friendships } = await supabase
      .from("friendships")
      .select("*")
      .eq("status", "pending_parent_approval")
      .or(kidIds.map(id => `requester_id.eq.${id}`).join(",") + "," + kidIds.map(id => `receiver_id.eq.${id}`).join(","));

    if (!friendships) return;

    // Get other player info
    const otherIds = friendships.map(f => {
      const myChildId = kidIds.find(id => id === f.requester_id || id === f.receiver_id);
      return f.requester_id === myChildId ? f.receiver_id : f.requester_id;
    });
    const { data: otherPlayers } = await supabase
      .from("students")
      .select("id, nickname, display_name")
      .in("id", [...new Set(otherIds)]);

    const playerMap = new Map(otherPlayers?.map(p => [p.id, p]) || []);

    const enriched = friendships.map(f => {
      const myChildId = kidIds.find(id => id === f.requester_id || id === f.receiver_id)!;
      const otherId = f.requester_id === myChildId ? f.receiver_id : f.requester_id;
      const isRequester = f.requester_id === myChildId;
      return {
        ...f,
        myChild: kidMap.get(myChildId),
        otherPlayer: playerMap.get(otherId),
        isRequester,
        needsMyApproval: isRequester ? !f.requester_parent_approved : !f.receiver_parent_approved,
      };
    });

    setPendingFriendships(enriched);
  };

  const handleApproveFriendship = async (friendshipId: string, isRequester: boolean) => {
    const updateField = isRequester ? "requester_parent_approved" : "receiver_parent_approved";

    // First update my approval
    const { error } = await supabase
      .from("friendships")
      .update({ [updateField]: true })
      .eq("id", friendshipId);

    if (error) {
      toast.error("Erro ao aprovar: " + error.message);
      return;
    }

    // Check if both parents approved - if so, set status to approved
    const { data: updated } = await supabase
      .from("friendships")
      .select("*")
      .eq("id", friendshipId)
      .single();

    if (updated && updated.requester_parent_approved && updated.receiver_parent_approved) {
      await supabase
        .from("friendships")
        .update({ status: "approved" })
        .eq("id", friendshipId);
      toast.success("Amizade aprovada por ambos os encarregados! 🎉");
    } else {
      toast.success("Aprovado! A aguardar o outro encarregado de educação.");
    }

    loadPendingFriendships();
  };

  const handleRejectFriendship = async (friendshipId: string) => {
    await supabase
      .from("friendships")
      .update({ status: "rejected" })
      .eq("id", friendshipId);
    toast.info("Pedido de amizade rejeitado.");
    loadPendingFriendships();
  };

  const handleUpgradeChild = (child: any) => {
    setPremiumChild(child);
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    }
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
          <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 mb-6">
            <TabsTrigger value="children" className="font-body text-xs gap-1">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Educandos</span><span className="sm:hidden">Filhos</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="font-body text-xs gap-1">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Progresso
            </TabsTrigger>
            <TabsTrigger value="social" className="font-body text-xs gap-1">
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Social
            </TabsTrigger>
            <TabsTrigger value="settings" className="font-body text-xs gap-1">
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Config
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
                  <div key={child.id} className="game-border bg-card p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-body font-bold truncate">{child.display_name}</h3>
                        {child.nickname && (
                          <p className="font-body text-xs text-primary">🎮 {child.nickname}</p>
                        )}
                        <p className="font-body text-sm text-muted-foreground">
                          {child.school_year}º Ano • Nível {child.village_level}
                        </p>
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-2">
                        <div className="flex gap-1.5 sm:gap-2 text-xs font-body flex-wrap">
                          <span className="bg-gold/20 px-2 py-1 rounded">🪙 {child.coins}</span>
                          <span className="bg-diamond/20 px-2 py-1 rounded">💎 {child.diamonds}</span>
                          <span className="bg-citizen/20 px-2 py-1 rounded">👥 {child.citizens}</span>
                        </div>
                        {child.is_premium ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-body text-gold flex items-center gap-1">
                              <Crown className="w-3 h-3" /> Premium ativo
                            </span>
                            <Button variant="ghost" size="sm" className="text-xs h-6" onClick={handleManageSubscription}>
                              Gerir
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="text-xs bg-gold text-foreground h-7 w-full sm:w-auto"
                            onClick={() => handleUpgradeChild(child)}
                          >
                            <Crown className="w-3 h-3 mr-1" />
                            Ativar Premium
                          </Button>
                        )}
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
            <div className="space-y-4">
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

              {/* Subject Priority Manager */}
              <div className="game-border bg-card p-4">
                <SubjectPriorityManager parentId={user!.id} children={children} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="social">
            <div className="space-y-4">
              <div className="game-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-secondary" />
                  <h2 className="font-display text-lg font-bold">Controlo Social</h2>
                </div>
                <p className="font-body text-sm text-muted-foreground mb-4">
                  Aprove ou rejeite os pedidos de amizade dos seus educandos. A amizade só é ativada quando ambos os encarregados aprovam.
                </p>

                {pendingFriendships.length === 0 ? (
                  <div className="text-center py-6">
                    <Shield className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-body text-sm text-muted-foreground">
                      Nenhum pedido de amizade pendente.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingFriendships.map((f: any) => (
                      <div key={f.id} className="border border-border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-body text-sm">
                              <strong>{f.myChild?.nickname || f.myChild?.display_name}</strong>
                              {f.isRequester ? " quer ser amigo de " : " recebeu pedido de "}
                              <strong>{f.otherPlayer?.nickname || f.otherPlayer?.display_name || "Jogador"}</strong>
                            </p>
                            <div className="font-body text-[10px] text-muted-foreground mt-1 flex gap-3">
                              <span>Pai de quem pede: {f.requester_parent_approved ? "✅ Aprovado" : "⏳ Pendente"}</span>
                              <span>Pai do solicitado: {f.receiver_parent_approved ? "✅ Aprovado" : "⏳ Pendente"}</span>
                            </div>
                          </div>
                          {f.needsMyApproval && (
                            <div className="flex gap-2 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-green-600 border-green-300"
                                onClick={() => handleApproveFriendship(f.id, f.isRequester)}
                              >
                                <Check className="w-4 h-4 mr-1" /> Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-destructive border-destructive/30"
                                onClick={() => handleRejectFriendship(f.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                          {!f.needsMyApproval && (
                            <span className="text-xs font-body text-green-600">✅ Aprovado por si</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chat Monitor */}
              <div className="game-border bg-card p-4">
                <ChatMonitor parentId={user!.id} children={children} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-4">
              <div className="game-border bg-card p-6">
                <h2 className="font-display text-xl font-bold mb-4">Configurações</h2>

                {/* Accessibility Settings */}
                <div className="parchment-bg rounded-lg p-4 mb-4">
                  <AccessibilitySettings userId={user!.id} table="profiles" />
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

      {/* Premium Modal */}
      {premiumChild && (
        <PremiumModal
          open={!!premiumChild}
          onOpenChange={(open) => !open && setPremiumChild(null)}
          studentId={premiumChild.id}
          isPremium={premiumChild.is_premium}
          associationCode={premiumChild.association_code}
          createdAt={premiumChild.created_at}
          subscriptionType={premiumChild.subscription_type}
        />
      )}
    </div>
  );
};

export default ParentDashboard;
