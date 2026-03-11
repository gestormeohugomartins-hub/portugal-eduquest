import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Crown, Gift } from "lucide-react";

export const GrantPremiumTab = () => {
  const [email, setEmail] = useState("");
  const [months, setMonths] = useState("1");
  const [applyToAll, setApplyToAll] = useState(false);
  const [granting, setGranting] = useState(false);

  const handleGrant = async () => {
    const m = parseInt(months);
    if (m < 1 || m > 24) {
      toast.error("Meses deve ser entre 1 e 24.");
      return;
    }
    if (!applyToAll && !email.trim()) {
      toast.error("Indique o email do utilizador ou ative 'Aplicar a todos'.");
      return;
    }

    setGranting(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: {
          action: "grant_premium",
          email: applyToAll ? undefined : email.trim().toLowerCase(),
          apply_to_all: applyToAll,
          months: m,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(data?.message || `Premium concedido por ${m} meses!`);
      setEmail("");
      setMonths("1");
      setApplyToAll(false);
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    }
    setGranting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Gift className="w-5 h-5 text-gold" />
        <h2 className="font-display text-xl font-bold">Conceder Premium</h2>
      </div>
      <p className="font-body text-xs text-muted-foreground">
        Ative o premium para utilizadores específicos ou todos os alunos por X meses, sem passar pelo Stripe.
      </p>

      <div className="bg-card rounded-xl border border-border p-4 space-y-3 max-w-lg">
        <div className="flex items-center gap-3">
          <Switch checked={applyToAll} onCheckedChange={setApplyToAll} />
          <label className="font-body text-sm">Aplicar a todos os alunos</label>
        </div>

        {!applyToAll && (
          <div>
            <label className="font-body text-xs font-medium block mb-1">Email do encarregado ou aluno</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@email.com"
            />
          </div>
        )}

        <div>
          <label className="font-body text-xs font-medium block mb-1">Duração (meses)</label>
          <Input
            type="number"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            min="1"
            max="24"
            placeholder="1"
          />
        </div>

        <Button onClick={handleGrant} disabled={granting} className="bg-gold text-foreground">
          <Crown className="w-4 h-4 mr-1" />
          {granting ? "A processar..." : "Conceder Premium"}
        </Button>
      </div>
    </div>
  );
};
