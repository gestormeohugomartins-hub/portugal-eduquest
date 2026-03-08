import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Building2, Users, TrendingUp, CreditCard, Copy, LogOut, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const AssociationDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [association, setAssociation] = useState<any>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriberCounts, setSubscriberCounts] = useState({ monthly: 0, annual: 0 });

  const loadData = async () => {
    if (!user?.email) return;
    setLoading(true);

    // Get association by email
    const { data: assoc } = await supabase
      .from("parent_associations")
      .select("*")
      .eq("email", user.email)
      .single();

    if (!assoc) {
      toast.error("Sem associação vinculada a esta conta.");
      navigate("/");
      return;
    }

    setAssociation(assoc);

    // Get donations
    const { data: donationData } = await supabase
      .from("association_donations")
      .select("*")
      .eq("association_id", assoc.id)
      .order("created_at", { ascending: false });

    setDonations(donationData || []);

    // Count subscribers by type
    const { data: students } = await supabase
      .from("students")
      .select("subscription_type" as any)
      .eq("association_code", assoc.association_code)
      .eq("is_premium", true);

    if (students) {
      const monthly = students.filter((s: any) => s.subscription_type === "monthly").length;
      const annual = students.filter((s: any) => s.subscription_type === "annual").length;
      setSubscriberCounts({ monthly, annual });
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // Auto-refresh every minute
    return () => clearInterval(interval);
  }, [user?.email]);

  const copyCode = () => {
    if (association?.association_code) {
      navigator.clipboard.writeText(association.association_code);
      toast.success("Código copiado!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 font-body text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!association) return null;

  const totalSubscribers = subscriberCounts.monthly + subscriberCounts.annual;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="font-display text-2xl font-bold">{association.name}</h1>
              <p className="font-body text-sm text-muted-foreground">Dashboard da Associação de Pais</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}>
              <LogOut className="w-4 h-4 mr-1" /> Sair
            </Button>
          </div>
        </div>

        {/* Association Code */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-sm text-muted-foreground">Código da Associação</p>
              <p className="font-display text-2xl font-bold tracking-wider">{association.association_code}</p>
            </div>
            <Button variant="outline" size="sm" onClick={copyCode}>
              <Copy className="w-4 h-4 mr-1" /> Copiar
            </Button>
          </div>
          <p className="font-body text-xs text-muted-foreground mt-2">
            Partilhe este código com os encarregados de educação. 10% de cada subscrição reverte para a associação.
          </p>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto text-primary mb-2" />
            <p className="font-display text-2xl font-bold">{totalSubscribers}</p>
            <p className="font-body text-xs text-muted-foreground">Total Subscritores</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl mb-1">📅</p>
            <p className="font-display text-2xl font-bold">{subscriberCounts.monthly}</p>
            <p className="font-body text-xs text-muted-foreground">Plano Mensal</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl mb-1">📆</p>
            <p className="font-display text-2xl font-bold">{subscriberCounts.annual}</p>
            <p className="font-body text-xs text-muted-foreground">Plano Anual</p>
          </Card>
          <Card className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto text-secondary mb-2" />
            <p className="font-display text-2xl font-bold">€{Number(association.total_raised || 0).toFixed(2)}</p>
            <p className="font-body text-xs text-muted-foreground">Total Angariado</p>
          </Card>
        </div>

        {/* Payment Info */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="font-display font-bold">Pagamentos</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="font-body text-sm text-muted-foreground">Total Angariado</p>
              <p className="font-display text-xl font-bold">€{Number(association.total_raised || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="font-body text-sm text-muted-foreground">Total Pago</p>
              <p className="font-display text-xl font-bold">€{Number(association.total_paid || 0).toFixed(2)}</p>
            </div>
          </div>
          <p className="font-body text-xs text-muted-foreground">
            Os pagamentos são efetuados quando o saldo atinge €100 ou no final do ano letivo.
          </p>
        </Card>

        {/* Recent Donations */}
        <Card className="p-4">
          <h2 className="font-display font-bold mb-3">Últimas Contribuições</h2>
          {donations.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground text-center py-4">
              Sem contribuições registadas ainda.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {donations.slice(0, 20).map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="font-body text-sm text-muted-foreground">
                    {new Date(d.created_at).toLocaleDateString("pt-PT")}
                  </span>
                  <span className="font-display font-bold text-secondary">
                    +€{Number(d.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AssociationDashboard;
