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
import { Crown, Heart, Building2 } from "lucide-react";
import { toast } from "sonner";

interface PremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  isPremium: boolean;
  associationCode?: string | null;
  createdAt: string;
}

export const PremiumModal = ({ open, onOpenChange, studentId, isPremium, associationCode, createdAt }: PremiumModalProps) => {
  const [code, setCode] = useState(associationCode || "");
  const [savingCode, setSavingCode] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const registrationDate = new Date(createdAt);
  const daysSinceRegistration = Math.floor((Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
  const canSetCode = daysSinceRegistration <= 30 && !associationCode;

  const handleSaveCode = async () => {
    if (!code.trim()) return;
    setSavingCode(true);

    // Verify code exists
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
      toast.success(`Código da ${(association as any).name} associado com sucesso! 1€ da tua subscrição reverte para a associação.`);
    }
    setSavingCode(false);
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { studentId, associationCode: code.trim().toUpperCase() || undefined },
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
      <DialogContent className="max-w-md">
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
              <p className="font-body text-sm text-muted-foreground">Tens acesso a 100% do conteúdo.</p>
            </div>
            <Button variant="outline" className="w-full" onClick={handleManageSubscription}>
              Gerir Subscrição
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-accent/20 rounded-lg p-4">
              <h3 className="font-display font-bold mb-2">O que inclui:</h3>
              <ul className="font-body text-sm space-y-1 text-muted-foreground">
                <li>✅ Evolução ilimitada (100% do ano)</li>
                <li>✅ Todas as perguntas e disciplinas</li>
                <li>✅ Progressão automática de ano</li>
                <li>✅ Conteúdo exclusivo</li>
              </ul>
              <p className="font-display font-bold text-xl text-center mt-4">€4,99 <span className="text-sm font-body font-normal text-muted-foreground">/ano escolar</span></p>
            </div>

            {/* Association Code */}
            <div className="border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-primary" />
                <Label className="font-body font-semibold text-sm">Código de Associação de Pais</Label>
              </div>
              {associationCode ? (
                <p className="font-body text-sm text-muted-foreground">
                  <Heart className="w-3 h-3 inline text-destructive" /> Código ativo: <strong>{associationCode}</strong> — 1€ reverte para a associação.
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
                  O prazo de 30 dias para inserir o código expirou.
                </p>
              )}
              <p className="font-body text-xs text-muted-foreground mt-1">
                Se a escola do teu educando tem uma Associação de Pais inscrita, 1€ da subscrição reverte para a associação.
              </p>
            </div>

            <Button
              className="w-full bg-gold text-foreground font-bold text-lg py-5"
              onClick={handleCheckout}
              disabled={checkingOut}
            >
              {checkingOut ? "A processar..." : "👑 Ativar Premium — €4,99/ano"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
