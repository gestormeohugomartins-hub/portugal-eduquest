import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LogOut, Users, ShieldCheck, Building2, UserPlus, Trash2, Shield, Ban, CheckCircle, Pencil, Eye, EyeOff, Search, ChevronLeft, ChevronRight, Tag, MailCheck, Crown } from "lucide-react";
import { PromoCodesTab } from "@/components/admin/PromoCodesTab";
import { GrantPremiumTab } from "@/components/admin/GrantPremiumTab";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  banned: boolean;
  banned_until: string | null;
  email_confirmed: boolean;
  display_name: string;
  app_role: string | null;
  admin_role: string | null;
  is_premium: boolean;
  school_year: string | null;
  district: string | null;
}

const AdminDashboard = () => {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Data
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [associations, setAssociations] = useState<any[]>([]);
  const [adminRoles, setAdminRoles] = useState<any[]>([]);

  // Create user form
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createDisplayName, setCreateDisplayName] = useState("");
  const [createRole, setCreateRole] = useState("parent");

  // Edit modal
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editAdminRole, setEditAdminRole] = useState("none");

  // Delete confirm
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);

  // Search & pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Stats
  const [stats, setStats] = useState({ totalStudents: 0, totalParents: 0, totalAssociations: 0, totalAdmins: 0 });

  useEffect(() => {
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        setIsLoggedIn(true);
        verifyAdmin(session.user);
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setCurrentUser(session.user);
      setIsLoggedIn(true);
      await verifyAdmin(session.user);
    } else {
      setLoading(false);
    }
  };

  const verifyAdmin = async (u: any) => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-admins", {
        body: { action: "check" },
      });

      if (error || !data?.isAdmin) {
        setIsAdmin(false);
        setLoading(false);
        toast.error("Acesso restrito a administradores. Esta conta não tem permissões de admin.");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
      loadAllData();
    } catch {
      setIsAdmin(false);
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      toast.error("Preencha email e password.");
      return;
    }
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword.trim(),
    });
    setLoginLoading(false);

    if (error) {
      toast.error("Credenciais inválidas.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCurrentUser(null);
    setAllUsers([]);
  };

  const loadAllData = async () => {
    await Promise.all([loadUsers(), loadAssociations(), loadAdminList()]);
  };

  const loadUsers = async () => {
    const { data, error } = await supabase.functions.invoke("manage-users", {
      body: { action: "list" },
    });
    if (data?.users) {
      setAllUsers(data.users);
      const students = data.users.filter((u: AdminUser) => u.app_role === "student");
      const parents = data.users.filter((u: AdminUser) => u.app_role === "parent" && !u.admin_role);
      const admins = data.users.filter((u: AdminUser) => u.admin_role);
      setStats(prev => ({
        ...prev,
        totalStudents: students.length,
        totalParents: parents.length,
        totalAdmins: admins.length,
      }));
    }
  };

  const loadAssociations = async () => {
    const { data } = await supabase.from("parent_associations").select("*").order("created_at", { ascending: false });
    setAssociations(data || []);
    setStats(prev => ({ ...prev, totalAssociations: data?.length || 0 }));
  };

  const loadAdminList = async () => {
    const { data } = await supabase.functions.invoke("manage-admins", {
      body: { action: "list" },
    });
    if (data?.roles) setAdminRoles(data.roles);
  };

  const handleAssociationStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("parent_associations").update({ status }).eq("id", id);
    if (error) toast.error("Erro ao atualizar estado.");
    else {
      toast.success(`Associação ${status === "approved" ? "aprovada" : "rejeitada"}.`);
      loadAssociations();
    }
  };

  const handleCreateUser = async () => {
    if (!createEmail.trim() || !createPassword.trim()) {
      toast.error("Email e password são obrigatórios.");
      return;
    }

    const { data, error } = await supabase.functions.invoke("manage-users", {
      body: {
        action: "create",
        email: createEmail.trim(),
        password: createPassword.trim(),
        role: createRole,
        display_name: createDisplayName.trim() || undefined,
      },
    });

    if (error || data?.error) {
      toast.error(data?.error || "Erro ao criar utilizador.");
      return;
    }

    toast.success("Utilizador criado com sucesso!");
    setCreateEmail("");
    setCreatePassword("");
    setCreateDisplayName("");
    setCreateRole("parent");
    loadAllData();
  };

  const handleSuspend = async (userId: string) => {
    const { data, error } = await supabase.functions.invoke("manage-users", {
      body: { action: "suspend", user_id: userId },
    });
    if (error || data?.error) toast.error(data?.error || "Erro ao suspender.");
    else { toast.success("Utilizador suspenso."); loadUsers(); }
  };

  const handleUnsuspend = async (userId: string) => {
    const { data, error } = await supabase.functions.invoke("manage-users", {
      body: { action: "unsuspend", user_id: userId },
    });
    if (error || data?.error) toast.error(data?.error || "Erro.");
    else { toast.success("Suspensão removida."); loadUsers(); }
  };

  const handleConfirmEmail = async (userId: string) => {
    const { data, error } = await supabase.functions.invoke("manage-users", {
      body: { action: "confirm", user_id: userId },
    });
    if (error || data?.error) toast.error(data?.error || "Erro ao confirmar.");
    else { toast.success("Email confirmado com sucesso!"); loadUsers(); }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    const { data, error } = await supabase.functions.invoke("manage-users", {
      body: { action: "delete", user_id: deleteUser.id },
    });
    if (error || data?.error) toast.error(data?.error || "Erro ao eliminar.");
    else { toast.success("Utilizador eliminado."); loadAllData(); }
    setDeleteUser(null);
  };

  const openEdit = (u: AdminUser) => {
    setEditUser(u);
    setEditDisplayName(u.display_name);
    setEditEmail(u.email);
    setEditPassword("");
    setEditAdminRole(u.admin_role || "none");
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    const { data, error } = await supabase.functions.invoke("manage-users", {
      body: {
        action: "update",
        user_id: editUser.id,
        display_name: editDisplayName || undefined,
        email: editEmail !== editUser.email ? editEmail : undefined,
        password: editPassword || undefined,
        admin_role: editAdminRole === "none" ? null : editAdminRole,
      },
    });
    if (error || data?.error) toast.error(data?.error || "Erro ao atualizar.");
    else { toast.success("Utilizador atualizado."); loadAllData(); }
    setEditUser(null);
  };

  // --- RENDER ---

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-display text-xl animate-pulse">A carregar...</p>
      </div>
    );
  }

  // Login screen
  if (!isLoggedIn || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-sm w-full">
          <div className="text-center mb-8">
            <img src={logo} alt="Questeduca" className="w-16 mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold text-foreground">Administração</h1>
            <p className="font-body text-sm text-muted-foreground mt-1">Acesso restrito a administradores</p>
          </div>

          {isLoggedIn && !isAdmin && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4 text-center">
              <p className="font-body text-sm text-destructive font-medium">
                A conta <strong>{currentUser?.email}</strong> não tem permissões de administrador.
              </p>
              <Button variant="ghost" size="sm" className="mt-2 text-muted-foreground" onClick={handleLogout}>
                Sair e tentar outra conta
              </Button>
            </div>
          )}

          {!isLoggedIn && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1 block">Email</label>
                <Input
                  type="email"
                  placeholder="admin@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-foreground mb-1 block">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button className="w-full bg-primary text-primary-foreground font-bold" onClick={handleLogin} disabled={loginLoading}>
                {loginLoading ? "A entrar..." : "Entrar"}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Filtered lists with search
  const q = searchQuery.toLowerCase();
  const filterBySearch = (u: AdminUser) =>
    !q || u.display_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);

  const studentUsers = allUsers.filter(u => u.app_role === "student").filter(filterBySearch);
  const parentUsers = allUsers.filter(u => u.app_role === "parent" && !u.admin_role).filter(filterBySearch);
  const adminUsers = allUsers.filter(u => u.admin_role).filter(filterBySearch);

  const allFiltered = [...studentUsers, ...parentUsers, ...adminUsers];
  const totalPages = Math.max(1, Math.ceil(allFiltered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedStudents = studentUsers;
  const paginatedParents = parentUsers;

  const Pagination = ({ total, filtered }: { total: number; filtered: number }) => {
    if (filtered <= ITEMS_PER_PAGE) return null;
    const pages = Math.ceil(filtered / ITEMS_PER_PAGE);
    return (
      <div className="flex items-center justify-between mt-3 px-1">
        <p className="font-body text-xs text-muted-foreground">{filtered} registos</p>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" disabled={safePage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-body text-xs px-2">{safePage}/{pages}</span>
          <Button size="sm" variant="ghost" disabled={safePage >= pages} onClick={() => setCurrentPage(p => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  const paginate = (list: AdminUser[]) => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return list.slice(start, start + ITEMS_PER_PAGE);
  };

  const UserRow = ({ u }: { u: AdminUser }) => (
    <tr className="border-b border-border/50">
      <td className="p-2 font-body font-semibold text-sm">{u.display_name}</td>
      <td className="p-2 font-body text-sm">{u.email}</td>
      <td className="p-2 font-body text-sm">
        {u.banned ? (
          <span className="text-xs px-2 py-0.5 rounded bg-destructive/20 text-destructive">Suspenso</span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded bg-secondary/20 text-secondary">Ativo</span>
        )}
        {u.email_confirmed === false && (
          <span className="ml-1 text-xs px-2 py-0.5 rounded bg-accent/20 text-accent">Não confirmado</span>
        )}
        {u.admin_role && (
          <span className="ml-1 text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
            {u.admin_role === "super_admin" ? "Super Admin" : "Admin"}
          </span>
        )}
      </td>
      <td className="p-2">
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(u)} title="Editar">
            <Pencil className="w-3 h-3" />
          </Button>
          {u.email_confirmed === false && (
            <Button size="sm" variant="ghost" onClick={() => handleConfirmEmail(u.id)} title="Confirmar email" className="text-accent">
              <MailCheck className="w-3 h-3" />
            </Button>
          )}
          {u.banned ? (
            <Button size="sm" variant="ghost" onClick={() => handleUnsuspend(u.id)} title="Reativar" className="text-secondary">
              <CheckCircle className="w-3 h-3" />
            </Button>
          ) : u.id !== currentUser?.id ? (
            <Button size="sm" variant="ghost" onClick={() => handleSuspend(u.id)} title="Suspender" className="text-accent">
              <Ban className="w-3 h-3" />
            </Button>
          ) : null}
          {u.id !== currentUser?.id && (
            <Button size="sm" variant="ghost" onClick={() => setDeleteUser(u)} title="Eliminar" className="text-destructive">
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b-2 border-border px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Questeduca" className="w-10 h-10" />
            <div>
              <h1 className="font-display text-lg font-bold">Painel Administração</h1>
              <p className="font-body text-xs text-muted-foreground">{currentUser?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Alunos", value: stats.totalStudents, icon: Users, color: "bg-primary/10 text-primary" },
            { label: "Pais", value: stats.totalParents, icon: ShieldCheck, color: "bg-secondary/10 text-secondary" },
            { label: "Associações", value: stats.totalAssociations, icon: Building2, color: "bg-accent/10 text-accent" },
            { label: "Admins", value: stats.totalAdmins, icon: Shield, color: "bg-primary/10 text-primary" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-body text-xl font-bold">{s.value}</p>
                <p className="font-body text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="users">
          <div className="overflow-x-auto -mx-4 px-4 mb-6">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:grid-cols-6 sm:w-full">
              <TabsTrigger value="users" className="font-body text-xs gap-1 whitespace-nowrap">
                <Users className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Utilizadores</span><span className="sm:hidden">Users</span>
              </TabsTrigger>
              <TabsTrigger value="associations" className="font-body text-xs gap-1 whitespace-nowrap">
                <Building2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Associações</span><span className="sm:hidden">Assoc.</span>
              </TabsTrigger>
              <TabsTrigger value="promos" className="font-body text-xs gap-1 whitespace-nowrap">
                <Tag className="w-3.5 h-3.5" /> Promos
              </TabsTrigger>
              <TabsTrigger value="premium" className="font-body text-xs gap-1 whitespace-nowrap">
                <Crown className="w-3.5 h-3.5" /> Premium
              </TabsTrigger>
              <TabsTrigger value="create" className="font-body text-xs gap-1 whitespace-nowrap">
                <UserPlus className="w-3.5 h-3.5" /> Criar
              </TabsTrigger>
              <TabsTrigger value="admins" className="font-body text-xs gap-1 whitespace-nowrap">
                <Shield className="w-3.5 h-3.5" /> Admins
              </TabsTrigger>
            </TabsList>
          </div>

          {/* USERS TAB */}
          <TabsContent value="users">
            <div className="space-y-6">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome ou email..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-10"
                />
              </div>

              {/* Students */}
              <div>
                <h2 className="font-display text-lg font-bold mb-2">Alunos ({studentUsers.length})</h2>
                {studentUsers.length === 0 ? (
                  <p className="font-body text-sm text-muted-foreground">Nenhum aluno encontrado.</p>
                ) : (
                  <>
                    <div className="overflow-x-auto bg-card rounded-xl border border-border">
                      <table className="w-full font-body text-sm">
                        <thead><tr className="border-b border-border text-left"><th className="p-2">Nome</th><th className="p-2">Email</th><th className="p-2">Estado</th><th className="p-2">Ações</th></tr></thead>
                        <tbody>{paginate(studentUsers).map(u => <UserRow key={u.id} u={u} />)}</tbody>
                      </table>
                    </div>
                    <Pagination total={studentUsers.length} filtered={studentUsers.length} />
                  </>
                )}
              </div>

              {/* Parents */}
              <div>
                <h2 className="font-display text-lg font-bold mb-2">Pais ({parentUsers.length})</h2>
                {parentUsers.length === 0 ? (
                  <p className="font-body text-sm text-muted-foreground">Nenhum pai encontrado.</p>
                ) : (
                  <>
                    <div className="overflow-x-auto bg-card rounded-xl border border-border">
                      <table className="w-full font-body text-sm">
                        <thead><tr className="border-b border-border text-left"><th className="p-2">Nome</th><th className="p-2">Email</th><th className="p-2">Estado</th><th className="p-2">Ações</th></tr></thead>
                        <tbody>{paginate(parentUsers).map(u => <UserRow key={u.id} u={u} />)}</tbody>
                      </table>
                    </div>
                    <Pagination total={parentUsers.length} filtered={parentUsers.length} />
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ASSOCIATIONS TAB */}
          <TabsContent value="associations">
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold">Associações de Pais</h2>
              {associations.length === 0 ? (
                <p className="font-body text-muted-foreground">Nenhuma associação registada.</p>
              ) : (
                associations.map((a) => {
                  const balance = Number(a.total_raised || 0) - Number(a.total_paid || 0);
                  return (
                    <div key={a.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="font-body font-bold">{a.name}</h3>
                          <p className="font-body text-sm text-muted-foreground">
                            Presidente: {a.president_name} • Código: <strong>{a.association_code}</strong>
                          </p>
                          <p className="font-body text-sm text-muted-foreground">
                            Email: {a.email} • IBAN: {a.iban || "N/D"}
                          </p>
                          {a.bank_account_holder && (
                            <p className="font-body text-sm text-muted-foreground">
                              Titular: {a.bank_account_holder}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-body px-2 py-1 rounded ${
                            a.status === "approved" ? "bg-secondary/20 text-secondary" :
                            a.status === "rejected" ? "bg-destructive/20 text-destructive" :
                            "bg-accent/20 text-accent-foreground"
                          }`}>
                            {a.status === "approved" ? "Aprovada" : a.status === "rejected" ? "Rejeitada" : "Pendente"}
                          </span>
                          {a.status === "pending" && (
                            <>
                              <Button size="sm" onClick={() => handleAssociationStatus(a.id, "approved")} className="bg-secondary text-secondary-foreground text-xs">Aprovar</Button>
                              <Button size="sm" variant="destructive" onClick={() => handleAssociationStatus(a.id, "rejected")} className="text-xs">Rejeitar</Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Financial Summary */}
                      {a.status === "approved" && (
                        <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                          <div className="grid grid-cols-3 gap-3 text-center mb-3">
                            <div>
                              <p className="font-body text-xs text-muted-foreground">Total Angariado</p>
                              <p className="font-display font-bold text-secondary">€{Number(a.total_raised || 0).toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="font-body text-xs text-muted-foreground">Total Pago</p>
                              <p className="font-display font-bold">€{Number(a.total_paid || 0).toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="font-body text-xs text-muted-foreground">Em Dívida</p>
                              <p className={`font-display font-bold ${balance > 0 ? "text-destructive" : "text-secondary"}`}>
                                €{balance.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          {balance > 0 && (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={balance}
                                placeholder={`Valor a pagar (max €${balance.toFixed(2)})`}
                                className="flex-1 text-sm"
                                id={`pay-${a.id}`}
                              />
                              <Button
                                size="sm"
                                className="bg-secondary text-secondary-foreground text-xs whitespace-nowrap"
                                onClick={async () => {
                                  const input = document.getElementById(`pay-${a.id}`) as HTMLInputElement;
                                  const amount = parseFloat(input?.value);
                                  if (!amount || amount <= 0 || amount > balance) {
                                    toast.error("Valor inválido.");
                                    return;
                                  }
                                  const newPaid = Number(a.total_paid || 0) + amount;
                                  const { error } = await supabase
                                    .from("parent_associations")
                                    .update({ total_paid: newPaid })
                                    .eq("id", a.id);
                                  if (error) {
                                    toast.error("Erro ao registar pagamento.");
                                  } else {
                                    toast.success(`Pagamento de €${amount.toFixed(2)} registado para ${a.name}.`);
                                    loadAssociations();
                                  }
                                }}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" /> Registar Pagamento
                              </Button>
                            </div>
                          )}
                          {balance <= 0 && (
                            <p className="font-body text-xs text-secondary text-center">✅ Sem valores em dívida</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* PROMO CODES TAB */}
          <TabsContent value="promos">
            <PromoCodesTab />
          </TabsContent>

          {/* GRANT PREMIUM TAB */}
          <TabsContent value="premium">
            <GrantPremiumTab />
          </TabsContent>

          {/* CREATE USER TAB */}
          <TabsContent value="create">
            <div className="max-w-lg">
              <h2 className="font-display text-xl font-bold mb-4">Criar Novo Utilizador</h2>
              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <div>
                  <label className="font-body text-sm font-medium block mb-1">Tipo de conta</label>
                  <Select value={createRole} onValueChange={setCreateRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Pai/Encarregado</SelectItem>
                      <SelectItem value="student">Aluno/Jogador</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-body text-sm font-medium block mb-1">Nome</label>
                  <Input value={createDisplayName} onChange={(e) => setCreateDisplayName(e.target.value)} placeholder="Nome do utilizador" />
                </div>
                <div>
                  <label className="font-body text-sm font-medium block mb-1">Email</label>
                  <Input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder="email@exemplo.com" />
                </div>
                <div>
                  <label className="font-body text-sm font-medium block mb-1">Password</label>
                  <Input type="text" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} placeholder="Password inicial" />
                </div>
                <Button className="w-full bg-primary text-primary-foreground font-bold" onClick={handleCreateUser}>
                  <UserPlus className="w-4 h-4 mr-2" /> Criar Utilizador
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ADMINS TAB */}
          <TabsContent value="admins">
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold">Administradores</h2>
              {adminUsers.length === 0 ? (
                <p className="font-body text-muted-foreground">Nenhum admin.</p>
              ) : (
                <div className="overflow-x-auto bg-card rounded-xl border border-border">
                  <table className="w-full font-body text-sm">
                    <thead><tr className="border-b border-border text-left"><th className="p-2">Nome</th><th className="p-2">Email</th><th className="p-2">Tipo</th><th className="p-2">Ações</th></tr></thead>
                    <tbody>
                      {adminUsers.map(u => (
                        <tr key={u.id} className="border-b border-border/50">
                          <td className="p-2 font-semibold">{u.display_name}</td>
                          <td className="p-2">{u.email}</td>
                          <td className="p-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${u.admin_role === "super_admin" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                              {u.admin_role === "super_admin" ? "Super Admin" : "Admin"}
                            </span>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => openEdit(u)}><Pencil className="w-3 h-3" /></Button>
                              {u.id !== currentUser?.id && (
                                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteUser(u)}><Trash2 className="w-3 h-3" /></Button>
                              )}
                            </div>
                          </td>
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

      {/* Edit Dialog */}
      <AlertDialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Editar Utilizador</AlertDialogTitle>
            <AlertDialogDescription>Altere os dados e clique Guardar.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="font-body text-sm font-medium block mb-1">Nome</label>
              <Input value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} />
            </div>
            <div>
              <label className="font-body text-sm font-medium block mb-1">Email</label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div>
              <label className="font-body text-sm font-medium block mb-1">Nova Password (deixar vazio para não alterar)</label>
              <Input type="text" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Nova password" />
            </div>
            <div>
              <label className="font-body text-sm font-medium block mb-1">Papel Admin</label>
              <Select value={editAdminRole} onValueChange={setEditAdminRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem papel admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveEdit}>Guardar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Utilizador</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar <strong>{deleteUser?.email}</strong>? Esta ação é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
