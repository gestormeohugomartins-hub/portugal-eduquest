import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Swords, Shield, Heart, Coins, Diamond, Star } from "lucide-react";

interface BattleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  defenseLevel: number;
  isPremium?: boolean;
  onBattleEnd: (won: boolean, coins: number, diamonds: number, xp: number) => void;
  onAnswerQuestion: () => Promise<boolean>;
}

const enemies = [
  { name: "Goblin Trapalhão", type: "monster", baseHealth: 30, emoji: "👺" },
  { name: "Esqueleto Estudioso", type: "monster", baseHealth: 40, emoji: "💀" },
  { name: "Alien Curioso", type: "alien", baseHealth: 50, emoji: "👽" },
  { name: "Dragão Bebé", type: "dragon", baseHealth: 60, emoji: "🐲" },
  { name: "Bruxa Malvada", type: "monster", baseHealth: 70, emoji: "🧙‍♀️" },
  { name: "Robô Invasor", type: "alien", baseHealth: 80, emoji: "🤖" },
];

export const BattleModal = ({
  open,
  onOpenChange,
  studentId,
  defenseLevel,
  isPremium = false,
  onBattleEnd,
  onAnswerQuestion,
}: BattleModalProps) => {
  const [battle, setBattle] = useState<{
    enemy: typeof enemies[0];
    enemyHealth: number;
    maxHealth: number;
    playerHealth: number;
    maxPlayerHealth: number;
    turn: number;
    phase: "intro" | "fighting" | "victory" | "defeat";
  } | null>(null);
  const [answering, setAnswering] = useState(false);

  useEffect(() => {
    if (open && !battle) {
      startBattle();
    }
  }, [open]);

  const startBattle = () => {
    const enemy = enemies[Math.floor(Math.random() * enemies.length)];
    const level = Math.max(1, defenseLevel);
    const maxHealth = enemy.baseHealth + (level * 10);
    const playerMaxHealth = 100 + (defenseLevel * 20);

    setBattle({
      enemy,
      enemyHealth: maxHealth,
      maxHealth,
      playerHealth: playerMaxHealth,
      maxPlayerHealth: playerMaxHealth,
      turn: 1,
      phase: "intro",
    });
  };

  const attack = async () => {
    if (!battle || answering) return;
    
    setAnswering(true);
    
    // Player answers a question to attack
    const correct = await onAnswerQuestion();
    
    if (correct) {
      // Deal damage to enemy
      const damage = 20 + (defenseLevel * 5) + Math.floor(Math.random() * 10);
      const newEnemyHealth = Math.max(0, battle.enemyHealth - damage);
      
      toast.success(`Acertaste! Causaste ${damage} de dano! ⚔️`);
      
      if (newEnemyHealth <= 0) {
        // Victory!
        const premiumMult = isPremium ? 1.15 : 1;
        const rewardCoins = Math.round((10 + (battle.turn * 5)) * premiumMult);
        const rewardDiamonds = Math.random() > 0.7 ? (isPremium ? 2 : 1) : 0;
        const rewardXp = Math.round((50 + (battle.turn * 10)) * premiumMult);
        
        setBattle({ ...battle, enemyHealth: 0, phase: "victory" });
        
        // Save battle result
        await supabase.from("battles").insert({
          student_id: studentId,
          enemy_name: battle.enemy.name,
          enemy_type: battle.enemy.type,
          enemy_level: defenseLevel,
          enemy_health: battle.maxHealth,
          damage_dealt: battle.maxHealth,
          battle_won: true,
          rewards_coins: rewardCoins,
          rewards_diamonds: rewardDiamonds,
          rewards_xp: rewardXp,
          ended_at: new Date().toISOString(),
        });
        
        setTimeout(() => {
          onBattleEnd(true, rewardCoins, rewardDiamonds, rewardXp);
        }, 2000);
      } else {
        // Enemy attacks back
        const enemyDamage = 10 + Math.floor(Math.random() * 15);
        const newPlayerHealth = Math.max(0, battle.playerHealth - enemyDamage);
        
        setBattle({
          ...battle,
          enemyHealth: newEnemyHealth,
          playerHealth: newPlayerHealth,
          turn: battle.turn + 1,
          phase: "fighting",
        });
        
        if (newPlayerHealth <= 0) {
          // Defeat
          setBattle(prev => prev ? { ...prev, playerHealth: 0, phase: "defeat" } : null);
          
          await supabase.from("battles").insert({
            student_id: studentId,
            enemy_name: battle.enemy.name,
            enemy_type: battle.enemy.type,
            enemy_level: defenseLevel,
            enemy_health: battle.maxHealth,
            damage_dealt: battle.maxHealth - newEnemyHealth,
            battle_won: false,
            ended_at: new Date().toISOString(),
          });
          
          setTimeout(() => {
            onBattleEnd(false, 0, 0, 0);
          }, 2000);
        } else {
          toast.error(`O inimigo atacou! Perdeste ${enemyDamage} de vida.`);
        }
      }
    } else {
      // Wrong answer - enemy attacks twice
      const enemyDamage = 15 + Math.floor(Math.random() * 20);
      const newPlayerHealth = Math.max(0, battle.playerHealth - enemyDamage);
      
      toast.error(`Resposta errada! O inimigo causou ${enemyDamage} de dano!`);
      
      if (newPlayerHealth <= 0) {
        setBattle(prev => prev ? { ...prev, playerHealth: 0, phase: "defeat" } : null);
        
        await supabase.from("battles").insert({
          student_id: studentId,
          enemy_name: battle.enemy.name,
          enemy_type: battle.enemy.type,
          enemy_level: defenseLevel,
          enemy_health: battle.maxHealth,
          damage_dealt: battle.maxHealth - battle.enemyHealth,
          battle_won: false,
          ended_at: new Date().toISOString(),
        });
        
        setTimeout(() => {
          onBattleEnd(false, 0, 0, 0);
        }, 2000);
      } else {
        setBattle({
          ...battle,
          playerHealth: newPlayerHealth,
          turn: battle.turn + 1,
          phase: "fighting",
        });
      }
    }
    
    setAnswering(false);
  };

  const flee = () => {
    toast.info("Fugiste da batalha!");
    onOpenChange(false);
    setBattle(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setBattle(null);
  };

  if (!battle) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Swords className="w-5 h-5 text-destructive" />
            Batalha!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enemy */}
          <div className="text-center">
            <div className="text-6xl mb-2">{battle.enemy.emoji}</div>
            <h3 className="font-display font-bold">{battle.enemy.name}</h3>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Heart className="w-4 h-4 text-destructive" />
              <Progress 
                value={(battle.enemyHealth / battle.maxHealth) * 100} 
                className="w-32 h-3"
              />
              <span className="text-sm font-mono">{battle.enemyHealth}/{battle.maxHealth}</span>
            </div>
          </div>

          {/* VS */}
          <div className="text-center font-display text-2xl text-muted-foreground">VS</div>

          {/* Player */}
          <div className="text-center">
            <div className="text-4xl mb-2">🏰</div>
            <h3 className="font-display font-bold">A Tua Aldeia</h3>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Shield className="w-4 h-4 text-primary" />
              <Progress 
                value={(battle.playerHealth / battle.maxPlayerHealth) * 100} 
                className="w-32 h-3"
              />
              <span className="text-sm font-mono">{battle.playerHealth}/{battle.maxPlayerHealth}</span>
            </div>
          </div>

          {/* Actions */}
          {battle.phase === "intro" && (
            <div className="text-center space-y-3">
              <p className="text-muted-foreground">
                Um {battle.enemy.name} está a atacar a tua aldeia!
              </p>
              <Button onClick={() => setBattle({ ...battle, phase: "fighting" })} className="w-full">
                ⚔️ Defender!
              </Button>
            </div>
          )}

          {battle.phase === "fighting" && (
            <div className="space-y-3">
              <p className="text-center text-sm text-muted-foreground">
                Turno {battle.turn} - Responde a uma pergunta para atacar!
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={attack} 
                  className="flex-1 bg-primary"
                  disabled={answering}
                >
                  {answering ? "A responder..." : "⚔️ Atacar"}
                </Button>
                <Button 
                  onClick={flee} 
                  variant="outline"
                  disabled={answering}
                >
                  🏃 Fugir
                </Button>
              </div>
            </div>
          )}

          {battle.phase === "victory" && (
            <div className="text-center space-y-3">
              <div className="text-4xl">🎉</div>
              <h3 className="font-display font-bold text-green-500">Vitória!</h3>
              <p className="text-muted-foreground">
                Derrotaste o {battle.enemy.name}!
              </p>
              <div className="flex items-center justify-center gap-4">
                <span className="flex items-center gap-1">
                  <Coins className="w-4 h-4 text-gold" /> +{10 + (battle.turn * 5)}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-primary" /> +{50 + (battle.turn * 10)} XP
                </span>
              </div>
            </div>
          )}

          {battle.phase === "defeat" && (
            <div className="text-center space-y-3">
              <div className="text-4xl">😢</div>
              <h3 className="font-display font-bold text-destructive">Derrota</h3>
              <p className="text-muted-foreground">
                O {battle.enemy.name} venceu desta vez. Tenta novamente!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};