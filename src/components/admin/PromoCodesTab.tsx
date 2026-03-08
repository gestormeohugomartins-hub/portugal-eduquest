import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Copy, Search, Filter } from "lucide-react";

interface PromoCode {
  id: string;
  code: string;
  discount_percent: number | null;
  discount_amount: number | null;
  max_uses: number | null;
  current_uses: number | null;
  is_active: boolean | null;
  expires_at: string | null;
  target_user_id: string | null;
  created_at: string | null;
}

export const PromoCodesTab = () => {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "expired">("all");

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newDiscountType, setNewDiscountType] = useState<"percent" | "amount">("percent");
  const [newDiscountValue, setNewDiscountValue] = useState("");
  const [newMaxUses, setNewMaxUses] = useState("1");
  const [newExpiresAt, setNewExpiresAt] = useState("");
  const [newTargetEmail, setNewTargetEmail] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setCodes(data as PromoCode[]);
    if (error) toast.error("Erro ao carregar códigos.");
    setLoading(false);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "QE-";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setNewCode(code);
  };

  const handleCreate = async () => {
    if (!newCode.trim() || !newDiscountValue) {
      toast.error("Código e valor de desconto são obrigatórios.");
      return;
    }
    setCreating(true);

    const { data, error } = await supabase.functions.invoke("manage-promo-codes", {
      body: {
        action: "create",
        code: newCode.trim().toUpperCase(),
        discount_percent: newDiscountType === "percent" ? parseInt(newDiscountValue) : 0,
        discount_amount: newDiscountType === "amount" ? parseFloat(newDiscountValue) : 0,
        max_uses: parseInt(newMaxUses) || 1,
        expires_at: newExpiresAt || null,
        target_email: newTargetEmail.trim() || null,
      },
    });

    setCreating(false);
    if (error || data?.error) {
      toast.error(data?.error || "Erro ao criar código.");
      return;
    }

    toast.success(`Código ${newCode} criado!`);
    setShowCreate(false);
    resetForm();
    loadCodes();
  };

  const resetForm = () => {
    setNewCode("");
    setNewDiscountType("percent");
    setNewDiscountValue("");
    setNewMaxUses("1");
    setNewExpiresAt("");
    setNewTargetEmail("");
  };

  const toggleActive = async (code: PromoCode) => {
    const { error } = await supabase.functions.invoke("manage-promo-codes", {
      body: { action: "toggle", code_id: code.id, is_active: !code.is_active },
    });
    if (error) toast.error("Erro ao atualizar.");
    else {
      toast.success(code.is_active ? "Código desativado." : "Código ativado.");
      loadCodes();
    }
  };

  const deleteCode = async (code: PromoCode) => {
    const { error } = await supabase.functions.invoke("manage-promo-codes", {
      body: { action: "delete", code_id: code.id },
    });
    if (error) toast.error("Erro ao eliminar.");
    else {
      toast.success("Código eliminado.");
      loadCodes();
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const filtered = codes.filter((c) => {
    const q = search.toLowerCase();
    if (q && !c.code.toLowerCase().includes(q)) return false;
    if (filterStatus === "active") return c.is_active && !isExpired(c.expires_at);
    if (filterStatus === "inactive") return !c.is_active;
    if (filterStatus === "expired") return isExpired(c.expires_at);
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold">Códigos Promocionais ({codes.length})</h2>
        <Button onClick={() => { setShowCreate(!showCreate); if (!showCreate) generateCode(); }} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Criar Código
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h3 className="font-display text-sm font-bold">Novo Código Promocional</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs font-medium block mb-1">Código</label>
              <div className="flex gap-2">
                <Input value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} placeholder="QE-XXXXXX" />
                <Button variant="outline" size="sm" onClick={generateCode} className="whitespace-nowrap text-xs">
                  Gerar
                </Button>
              </div>
            </div>
            <div>
              <label className="font-body text-xs font-medium block mb-1">Tipo de desconto</label>
              <Select value={newDiscountType} onValueChange={(v: "percent" | "amount") => setNewDiscountType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentagem (%)</SelectItem>
                  <SelectItem value="amount">Valor fixo (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-body text-xs font-medium block mb-1">
                Valor {newDiscountType === "percent" ? "(%)" : "(€)"}
              </label>
              <Input
                type="number"
                value={newDiscountValue}
                onChange={(e) => setNewDiscountValue(e.target.value)}
                placeholder={newDiscountType === "percent" ? "10" : "1.00"}
                min="0"
                max={newDiscountType === "percent" ? "100" : "99"}
              />
            </div>
            <div>
              <label className="font-body text-xs font-medium block mb-1">Máximo de utilizações</label>
              <Input type="number" value={newMaxUses} onChange={(e) => setNewMaxUses(e.target.value)} min="1" />
            </div>
            <div>
              <label className="font-body text-xs font-medium block mb-1">Válido até (opcional)</label>
              <Input type="datetime-local" value={newExpiresAt} onChange={(e) => setNewExpiresAt(e.target.value)} />
            </div>
            <div>
              <label className="font-body text-xs font-medium block mb-1">Email específico (opcional)</label>
              <Input type="email" value={newTargetEmail} onChange={(e) => setNewTargetEmail(e.target.value)} placeholder="user@email.com" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleCreate} disabled={creating} size="sm">
              {creating ? "A criar..." : "Criar Código"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowCreate(false); resetForm(); }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
          <SelectTrigger className="w-40">
            <Filter className="w-3 h-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
            <SelectItem value="expired">Expirados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <p className="font-body text-sm text-muted-foreground animate-pulse">A carregar...</p>
      ) : filtered.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground">Nenhum código encontrado.</p>
      ) : (
        <div className="overflow-x-auto bg-card rounded-xl border border-border">
          <table className="w-full font-body text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-2">Código</th>
                <th className="p-2">Desconto</th>
                <th className="p-2">Utilizações</th>
                <th className="p-2">Validade</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const expired = isExpired(c.expires_at);
                const exhausted = c.max_uses !== null && c.current_uses !== null && c.current_uses >= c.max_uses;
                return (
                  <tr key={c.id} className="border-b border-border/50">
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <code className="font-mono font-bold text-xs bg-muted px-1.5 py-0.5 rounded">{c.code}</code>
                        <button onClick={() => copyCode(c.code)} className="text-muted-foreground hover:text-foreground">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      {c.target_user_id && (
                        <span className="text-[10px] text-muted-foreground">Utilizador específico</span>
                      )}
                    </td>
                    <td className="p-2">
                      {c.discount_percent && c.discount_percent > 0
                        ? `${c.discount_percent}%`
                        : c.discount_amount && c.discount_amount > 0
                        ? `${c.discount_amount}€`
                        : "—"}
                    </td>
                    <td className="p-2">
                      <span className={exhausted ? "text-destructive font-bold" : ""}>
                        {c.current_uses || 0}/{c.max_uses || "∞"}
                      </span>
                    </td>
                    <td className="p-2 text-xs">
                      {c.expires_at ? (
                        <span className={expired ? "text-destructive" : ""}>
                          {new Date(c.expires_at).toLocaleDateString("pt-PT")}
                          {expired && " (expirado)"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Sem limite</span>
                      )}
                    </td>
                    <td className="p-2">
                      {expired ? (
                        <Badge variant="destructive" className="text-[10px]">Expirado</Badge>
                      ) : exhausted ? (
                        <Badge variant="secondary" className="text-[10px]">Esgotado</Badge>
                      ) : c.is_active ? (
                        <Badge className="text-[10px] bg-secondary/20 text-secondary border-secondary/30">Ativo</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Inativo</Badge>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={c.is_active || false}
                          onCheckedChange={() => toggleActive(c)}
                          className="scale-75"
                        />
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteCode(c)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
