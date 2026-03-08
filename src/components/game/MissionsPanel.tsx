import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Target, Coins, Diamond, Star, Clock } from "lucide-react";

interface Mission {
  id: string;
  title: string;
  description: string;
  mission_type: string;
  target_count: number;
  reward_coins: number;
  reward_diamonds: number;
  reward_xp: number;
  subject: string | null;
}

interface PlayerMission {
  id: string;
  mission_id: string;
  progress: number;
  completed: boolean;
  expires_at: string;
  mission: Mission;
}

interface MissionsPanelProps {
  studentId: string;
  onClaimReward: (coins: number, diamonds: number, xp: number) => void;
}

export const MissionsPanel = ({ studentId, onClaimReward }: MissionsPanelProps) => {
  const [missions, setMissions] = useState<PlayerMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    fetchMissions();
  }, [studentId]);

  const fetchMissions = async () => {
    const { data } = await supabase
      .from("player_missions")
      .select(`
        *,
        mission:missions(*)
      `)
      .eq("student_id", studentId)
      .gte("expires_at", new Date().toISOString())
      .order("expires_at");

    if (data) {
      setMissions(data as unknown as PlayerMission[]);
    }
    setLoading(false);
  };

  const claimReward = async (playerMission: PlayerMission) => {
    if (!playerMission.completed || playerMission.progress < playerMission.mission.target_count) {
      return;
    }

    setClaiming(playerMission.id);

    // Delete the completed mission
    await supabase
      .from("player_missions")
      .delete()
      .eq("id", playerMission.id);

    onClaimReward(
      playerMission.mission.reward_coins,
      playerMission.mission.reward_diamonds,
      playerMission.mission.reward_xp
    );

    toast.success("Recompensa reclamada! 🎉");
    setMissions(missions.filter(m => m.id !== playerMission.id));
    setClaiming(null);
  };

  const getMissionTypeLabel = (type: string) => {
    switch (type) {
      case "daily": return "Diária";
      case "weekly": return "Semanal";
      case "monthly": return "Mensal";
      default: return type;
    }
  };

  const getSubjectLabel = (subject: string | null) => {
    if (!subject) return null;
    const labels: Record<string, string> = {
      portugues: "Português",
      matematica: "Matemática",
      estudo_meio: "Estudo do Meio",
      ingles: "Inglês",
    };
    return labels[subject] || subject;
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      return `${Math.floor(hours / 24)}d`;
    }
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">A carregar missões...</div>;
  }

  if (missions.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-display font-bold mb-1">Sem Missões Ativas</h3>
        <p className="text-sm text-muted-foreground">
          Novas missões serão atribuídas em breve!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-display font-bold flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" />
        Missões
      </h3>
      
      {missions.map(pm => {
        const progress = Math.min((pm.progress / pm.mission.target_count) * 100, 100);
        const isComplete = pm.progress >= pm.mission.target_count;

        return (
          <Card key={pm.id} className={`p-4 ${isComplete ? "border-green-500 bg-green-500/5" : ""}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-body font-semibold text-sm">{pm.mission.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {getMissionTypeLabel(pm.mission.mission_type)}
                  </Badge>
                  {pm.mission.subject && (
                    <Badge variant="secondary" className="text-xs">
                      {getSubjectLabel(pm.mission.subject)}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{pm.mission.description}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {getTimeRemaining(pm.expires_at)}
              </div>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>{pm.progress} / {pm.mission.target_count}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs">
                {pm.mission.reward_coins > 0 && (
                  <span className="flex items-center gap-1">
                    <Coins className="w-3 h-3 text-gold" /> +{pm.mission.reward_coins}
                  </span>
                )}
                {pm.mission.reward_diamonds > 0 && (
                  <span className="flex items-center gap-1">
                    <Diamond className="w-3 h-3 text-diamond" /> +{pm.mission.reward_diamonds}
                  </span>
                )}
                {pm.mission.reward_xp > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-primary" /> +{pm.mission.reward_xp} XP
                  </span>
                )}
              </div>
              
              {isComplete && (
                <Button 
                  size="sm" 
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => claimReward(pm)}
                  disabled={claiming === pm.id}
                >
                  {claiming === pm.id ? "..." : "🎁 Reclamar"}
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};