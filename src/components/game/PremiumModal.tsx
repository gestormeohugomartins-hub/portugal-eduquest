import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Crown, Heart, Building2, Tag, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface PremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  isPremium: boolean;
  associationCode?: string | null;
  createdAt: string;
  subscriptionType?: string | null;
}

export const PremiumModal = ({ open, onOpenChange, studentId, isPremium, associationCode, createdAt, subscriptionType }: PremiumModalProps) => {
  const [code, setCode] = useState(associationCode || "");
  const [savingCode, setSavingCode] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ discount_percent: number; discount_amount: number } | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");

  const registrationDate = new Date(createdAt);
  const daysSinceRegistration = Math.floor((Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
  // For premium users, allow association code without time limit
  const canSetCode = isPremium || (daysSinceRegistration <= 30 && !associationCode);

  const monthlyPrice = 1.99;
  const annualPrice = 21.49;
  const monthlyEquivalent = (annualPrice / 12).toFixed(2);

  const basePrice = selectedPlan === "annual" ? annualPrice : monthlyPrice;
  const finalPrice = promoApplied
    ? Math.max(0, basePrice - (promoApplied.discount_amount || 0) - basePrice * (promoApplied.discount_percent || 0) / 100)
    : basePrice;

  const handleSaveCode = async () => {
    if (!code.trim()) return;
    setSavingCode(true);

    const { data: association } = await supabase
      .from("parent_associations")
      .select("id, name, status")
      .eq("association_code", code.trim().toUpperCase())
      .single();

    if (!association || (association as any).status !== "approved") {
      toast.error("Código de associação inválido ou não aprovado.");
      setSavingCode(false);
      return;
    }

    const { error } = await supabase
      .from("students")
      .update({
        association_code: code.trim().toUpperCase(),
        association_code_set_at: new Date().toISOString(),
      } as any)
      .eq("id", studentId);

    if (error) {
      toast.error("Erro ao guardar código.");
    } else {
      toast.success(`Código da ${(association as any).name} associado! 10% da subscrição reverte para a associação.`);
    }
    setSavingCode(false);
  };

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return;
    setValidatingPromo(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-promo-code", {
        body: { code: promoCode.trim() },
      });
      if (error) throw error;
      if (data?.valid) {
        setPromoApplied({ discount_percent: data.discount_percent, discount_amount: data.discount_amount });
        toast.success("Código promocional aplicado! 🎉");
      } else {
        toast.error(data?.error || "Código inválido.");
      }
    } catch (e: any) {
      toast.error("Erro ao validar código: " + e.message);
    }
    setValidatingPromo(false);
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          studentId,
          plan: selectedPlan,
          associationCode: code.trim().toUpperCase() || undefined,
          promoCode: promoApplied ? promoCode.trim().toUpperCase() : undefined,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast.error("Erro ao iniciar pagamento: " + error.message);
    }
    setCheckingOut(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Crown className="w-6 h-6 text-gold" />
            Questeduca Premium
          </DialogTitle>
        </DialogHeader>

        {isPremium ? (
          <div className="space-y-4">
            <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 text-center">
              <Crown className="w-10 h-10 text-gold mx-auto mb-2" />
              <p className="font-display font-bold text-lg">Premium Ativo!</p>
              <p className="font-body text-sm text-muted-foreground">
                Plano {subscriptionType === "annual" ? "Anual" : "Mensal"} — Todos os ganhos +15%
              </p>
            </div>
            <Button variant="outline" className="w-full" onClick={handleManageSubscription}>
              Gerir Subscrição
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Plan Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedPlan("monthly")}
                className={`relative rounded-lg border-2 p-3 text-center transition-all ${
                  selectedPlan === "monthly"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <p className="font-display font-bold text-sm">Mensal</p>
                <p className="font-display text-xl font-bold">€{monthlyPrice.toFixed(2)}</p>
                <p className="font-body text-xs text-muted-foreground">/mês</p>
              </button>
              <button
                onClick={() => setSelectedPlan("annual")}
                className={`relative rounded-lg border-2 p-3 text-center transition-all ${
                  selectedPlan === "annual"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Poupa 10%
                </div>
                <p className="font-display font-bold text-sm">Anual</p>
                <p className="font-display text-xl font-bold">€{annualPrice.toFixed(2)}</p>
                <p className="font-body text-xs text-muted-foreground">€{monthlyEquivalent}/mês</p>
              </button>
            </div>

            {/* Benefits */}
            <div className="bg-accent/20 rounded-lg p-4">
              <h3 className="font-display font-bold mb-2 flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-gold" /> Vantagens Premium:
              </h3>
              <ul className="font-body text-sm space-y-1.5 text-muted-foreground">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" /> <span><strong>+15% imediato</strong> em terreno e todos os materiais</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" /> <span><strong>+15% em todos os ganhos</strong> (moedas, XP, materiais)</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" /> Evolução ilimitada (100% do currículo)</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" /> Monumentos exclusivos e expansão total</li>
                {selectedPlan === "annual" && (
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" /> <span className="text-foreground font-semibold">🏥 Edifício essencial GRÁTIS (Hospital, Câmara, etc.)</span></li>
                )}
              </ul>
            </div>

            {/* Promo Code */}
            <div className="border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-primary" />
                <Label className="font-body font-semibold text-sm">Código Promocional</Label>
              </div>
              {promoApplied ? (
                <p className="font-body text-sm text-green-600">
                  ✅ Desconto aplicado: {promoApplied.discount_percent > 0 ? `${promoApplied.discount_percent}%` : `€${promoApplied.discount_amount}`}
                </p>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="PROMO-XXXX"
                    className="flex-1"
                    maxLength={20}
                  />
                  <Button size="sm" variant="outline" onClick={handleValidatePromo} disabled={validatingPromo}>
                    {validatingPromo ? "..." : "Aplicar"}
                  </Button>
                </div>
              )}
            </div>

            {/* Association Code */}
            <div className="border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-primary" />
                <Label className="font-body font-semibold text-sm">Código de Associação de Pais</Label>
              </div>
              {associationCode ? (
                <p className="font-body text-sm text-muted-foreground">
                  <Heart className="w-3 h-3 inline text-destructive" /> Código ativo: <strong>{associationCode}</strong> — 10% reverte para a associação.
                </p>
              ) : canSetCode ? (
                <div className="flex gap-2">
                  <Input
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="AP-XXXXXX"
                    className="flex-1"
                    maxLength={9}
                  />
                  <Button size="sm" variant="outline" onClick={handleSaveCode} disabled={savingCode}>
                    {savingCode ? "..." : "Aplicar"}
                  </Button>
                </div>
              ) : (
                <p className="font-body text-xs text-muted-foreground">
                  {isPremium 
                    ? "Já tem um código de associação ativo."
                    : "O prazo de 30 dias para inserir o código expirou. Ative o Premium para poder inserir o código."
                  }
                </p>
              )}
              <p className="font-body text-xs text-muted-foreground mt-1">
                10% da subscrição reverte para a Associação de Pais da escola.
              </p>
            </div>

            <Button
              className="w-full bg-gold text-foreground font-bold text-lg py-5"
              onClick={handleCheckout}
              disabled={checkingOut}
            >
              {checkingOut ? "A processar..." : `👑 Ativar Premium — €${finalPrice.toFixed(2)}/${selectedPlan === "annual" ? "ano" : "mês"}`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
