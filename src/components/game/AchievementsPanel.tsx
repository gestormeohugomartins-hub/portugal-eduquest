import { Trophy } from "lucide-react";

interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string | null;
  icon: string;
  xp_reward: number;
  coins_reward: number;
  diamonds_reward: number;
}

interface AchievementsPanelProps {
  achievements: Achievement[];
  unlocked: Set<string>;
}

export const AchievementsPanel = ({ achievements, unlocked }: AchievementsPanelProps) => {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-sm font-bold flex items-center gap-2">
        <Trophy className="w-4 h-4 text-gold" />
        Conquistas ({unlocked.size}/{achievements.length})
      </h3>
      <div className="grid grid-cols-1 gap-2">
        {achievements.map(a => {
          const isUnlocked = unlocked.has(a.id);
          return (
            <div
              key={a.id}
              className={`flex items-center gap-3 p-2 rounded-lg border text-xs font-body transition-all ${
                isUnlocked
                  ? "bg-gold/10 border-gold/30"
                  : "bg-muted/30 border-border opacity-60"
              }`}
            >
              <span className="text-xl">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-bold truncate ${isUnlocked ? "text-foreground" : "text-muted-foreground"}`}>
                  {a.title}
                </p>
                <p className="text-muted-foreground text-[10px] truncate">{a.description}</p>
              </div>
              {isUnlocked && (
                <span className="text-green-500 text-[10px] font-bold whitespace-nowrap">✅</span>
              )}
              {!isUnlocked && a.xp_reward > 0 && (
                <span className="text-muted-foreground text-[10px] whitespace-nowrap">+{a.xp_reward}XP</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
