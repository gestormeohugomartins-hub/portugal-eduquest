import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SFX } from "@/lib/sounds";

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

interface UnlockedAchievement {
  achievement_id: string;
  unlocked_at: string;
}

export const useAchievements = (studentId: string | undefined) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!studentId) return;
    loadAchievements();
  }, [studentId]);

  const loadAchievements = async () => {
    const [{ data: all }, { data: mine }] = await Promise.all([
      supabase.from("achievements" as any).select("*"),
      supabase.from("player_achievements" as any).select("achievement_id, unlocked_at").eq("student_id", studentId!),
    ]);
    if (all) setAchievements(all as any);
    if (mine) setUnlocked(new Set((mine as any[]).map((m: any) => m.achievement_id)));
  };

  const tryUnlock = useCallback(async (key: string) => {
    if (!studentId) return false;
    const achievement = achievements.find(a => a.key === key);
    if (!achievement || unlocked.has(achievement.id)) return false;

    const { error } = await supabase.from("player_achievements" as any).insert({
      student_id: studentId,
      achievement_id: achievement.id,
    } as any);

    if (error) return false; // likely duplicate

    // Grant rewards
    if (achievement.xp_reward || achievement.coins_reward || achievement.diamonds_reward) {
      const { data: student } = await supabase.from("students").select("xp, coins, diamonds").eq("id", studentId).single();
      if (student) {
        await supabase.from("students").update({
          xp: student.xp + achievement.xp_reward,
          coins: student.coins + achievement.coins_reward,
          diamonds: student.diamonds + achievement.diamonds_reward,
        }).eq("id", studentId);
      }
    }

    setUnlocked(prev => new Set([...prev, achievement.id]));
    SFX.upgrade();
    toast.success(`🏆 Conquista desbloqueada: ${achievement.icon} ${achievement.title}!`, { duration: 5000 });
    return true;
  }, [studentId, achievements, unlocked]);

  const checkAchievements = useCallback(async (context: {
    buildingCount?: number;
    villageLevel?: number;
    correctQuizzes?: number;
    tradeCount?: number;
    battleWins?: number;
    isPremium?: boolean;
  }) => {
    const { buildingCount, villageLevel, correctQuizzes, tradeCount, battleWins, isPremium } = context;
    if (buildingCount !== undefined && buildingCount >= 1) await tryUnlock("first_building");
    if (buildingCount !== undefined && buildingCount >= 10) await tryUnlock("ten_buildings");
    if (villageLevel !== undefined && villageLevel >= 3) await tryUnlock("village_level_3");
    if (villageLevel !== undefined && villageLevel >= 5) await tryUnlock("village_level_5");
    if (correctQuizzes !== undefined && correctQuizzes >= 10) await tryUnlock("quiz_10");
    if (correctQuizzes !== undefined && correctQuizzes >= 50) await tryUnlock("quiz_50");
    if (correctQuizzes !== undefined && correctQuizzes >= 100) await tryUnlock("quiz_100");
    if (tradeCount !== undefined && tradeCount >= 1) await tryUnlock("first_trade");
    if (battleWins !== undefined && battleWins >= 1) await tryUnlock("first_battle_win");
    if (isPremium) await tryUnlock("premium_member");
  }, [tryUnlock]);

  return { achievements, unlocked, checkAchievements, tryUnlock, reload: loadAchievements };
};
