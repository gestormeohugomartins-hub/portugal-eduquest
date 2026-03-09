import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { VillageView } from "@/components/game/VillageView";
import { GameHUD } from "@/components/game/GameHUD";
import { QuizModal } from "@/components/game/QuizModal";
import { PortugalMap } from "@/components/game/PortugalMap";
import { ChatPanel } from "@/components/game/ChatPanel";
import { ShopModal } from "@/components/game/ShopModal";
import { MissionsPanel } from "@/components/game/MissionsPanel";
import { BattleModal } from "@/components/game/BattleModal";
import { RankingsPanel } from "@/components/game/RankingsPanel";
import { MonthlyTestModal } from "@/components/game/MonthlyTestModal";
import { AchievementsPanel } from "@/components/game/AchievementsPanel";
import { SettingsPanel } from "@/components/game/SettingsPanel";
import { useAchievements } from "@/hooks/useAchievements";
import { useNotifications } from "@/hooks/useNotifications";
import { AccessibilityWrapper } from "@/components/accessibility/AccessibilityWrapper";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { 
  Map, MessageCircle, BookOpen, LogOut, Home, 
  ShoppingBag, Target, Swords, Trophy, Menu, GraduationCap, Crown 
} from "lucide-react";

type GameView = "village" | "map" | "chat";

const GamePage = () => {
  const { user, studentData, isStudent, loading, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<GameView>("village");
  const [showQuiz, setShowQuiz] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showBattle, setShowBattle] = useState(false);
  const [showMonthlyTest, setShowMonthlyTest] = useState(false);
  const [battleQuizCallback, setBattleQuizCallback] = useState<(() => Promise<boolean>) | null>(null);
  const { achievements, unlocked, checkAchievements } = useAchievements(studentData?.id);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(studentData?.id);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
    if (!loading && user && !isStudent) navigate("/parent");
  }, [user, isStudent, loading]);

  // Random battle trigger
  useEffect(() => {
    if (!studentData) return;
    
    // 10% chance of battle every 2 minutes of gameplay
    const battleInterval = setInterval(() => {
      if (Math.random() < 0.1 && !showQuiz && !showBattle && !showShop) {
        toast.info("⚠️ A tua aldeia está a ser atacada!", { duration: 3000 });
        setTimeout(() => setShowBattle(true), 1000);
      }
    }, 120000);

    return () => clearInterval(battleInterval);
  }, [studentData, showQuiz, showBattle, showShop]);

  const handleClaimMissionReward = async (coins: number, diamonds: number, xp: number) => {
    if (!studentData) return;
    
    await supabase
      .from("students")
      .update({
        coins: studentData.coins + coins,
        diamonds: studentData.diamonds + diamonds,
        xp: studentData.xp + xp,
      })
      .eq("id", studentData.id);

    refreshProfile();
    // Check achievements after gaining rewards
    if (studentData) {
      const { count } = await supabase.from("quiz_history").select("*", { count: "exact", head: true }).eq("student_id", studentData.id).eq("answered_correctly", true);
      checkAchievements({ correctQuizzes: count || 0 });
    }
  };

  const handleBattleEnd = async (won: boolean, coins: number, diamonds: number, xp: number) => {
    if (!studentData) return;
    
    if (won) {
      await supabase
        .from("students")
        .update({
          coins: studentData.coins + coins,
          diamonds: studentData.diamonds + diamonds,
          xp: studentData.xp + xp,
        })
        .eq("id", studentData.id);
      
      toast.success(`Ganhaste ${coins} moedas e ${xp} XP! 🎉`);
    } else {
      toast.error("Perdeste a batalha. Estuda mais para ficares mais forte!");
    }

    setShowBattle(false);
    refreshProfile();
  };

  const handleBattleAnswerQuestion = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      // This will be called when attack button is pressed in battle
      // For simplicity, we'll simulate with a random correct/incorrect
      // In a full implementation, this would show the quiz modal
      const correct = Math.random() > 0.3; // 70% success rate for demo
      setTimeout(() => resolve(correct), 500);
    });
  }, []);

  const handleMonthlyTestStart = (testId: string, questionCount: number) => {
    toast.info(`Teste mensal iniciado! ${questionCount} perguntas.`);
    setShowQuiz(true);
  };

  const checkBuildingAchievements = async () => {
    if (!studentData) return;
    const { count } = await supabase.from("buildings").select("*", { count: "exact", head: true }).eq("student_id", studentData.id);
    checkAchievements({
      buildingCount: count || 0,
      villageLevel: studentData.village_level,
      isPremium: studentData.is_premium,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-body text-sm text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <p className="font-body text-base text-foreground">Não foi possível carregar os dados do jogador.</p>
          <Button variant="outline" onClick={() => { signOut(); navigate("/login"); }}>
            Voltar ao login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AccessibilityWrapper studentId={studentData.id}>
      <div className="min-h-screen bg-background relative overflow-hidden">
      <GameHUD
        student={studentData}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
      />

      {/* Side Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="fixed top-16 right-4 z-40"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-80 overflow-y-auto">
          <div className="space-y-6 py-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="flex flex-col gap-2 h-auto py-4"
                onClick={() => setShowShop(true)}
              >
                <ShoppingBag className="w-6 h-6 text-gold" />
                <span className="text-xs">Loja</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col gap-2 h-auto py-4"
                onClick={() => setShowBattle(true)}
              >
                <Swords className="w-6 h-6 text-destructive" />
                <span className="text-xs">Batalhar</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col gap-2 h-auto py-4"
                onClick={() => setShowMonthlyTest(true)}
              >
                <GraduationCap className="w-6 h-6 text-primary" />
                <span className="text-xs">Testes</span>
              </Button>
              {studentData.is_premium ? (
                <div className="flex flex-col gap-2 h-auto py-4 items-center text-xs text-gold border border-gold/30 rounded-md px-2">
                  <Crown className="w-6 h-6 text-gold" />
                  <span>Premium ✓</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2 h-auto py-4 items-center text-xs text-muted-foreground border border-border rounded-md px-2">
                  <Crown className="w-6 h-6 text-muted-foreground" />
                  <span>Free</span>
                </div>
              )}
            </div>

            {/* Missions */}
            <MissionsPanel 
              studentId={studentData.id} 
              onClaimReward={handleClaimMissionReward}
            />

            {/* Rankings */}
            <RankingsPanel 
              studentId={studentData.id}
              district={studentData.district}
              schoolName={(studentData as any).school_name}
            />

            {/* Achievements */}
            <AchievementsPanel achievements={achievements} unlocked={unlocked} />

            {/* Settings */}
            <SettingsPanel
              studentId={studentData.id}
              quizRemindersEnabled={(studentData as any).quiz_reminders_enabled ?? true}
              onUpdate={refreshProfile}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main View */}
      <div className="pt-20 pb-20">
        {view === "village" && <VillageView student={studentData} onQuiz={() => setShowQuiz(true)} onRefresh={() => { refreshProfile(); checkBuildingAchievements(); }} />}
        {view === "map" && <PortugalMap studentId={studentData.id} district={studentData.district} />}
        {view === "chat" && <ChatPanel studentId={studentData.id} />}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t-2 border-border z-50 safe-bottom">
        <div className="flex justify-around items-center py-1.5 sm:py-2 px-2 sm:px-4 max-w-lg mx-auto">
          <Button 
            variant={view === "village" ? "default" : "ghost"} 
            size="sm" 
            onClick={() => setView("village")}
            className="flex flex-col gap-1 h-auto py-2"
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-body">Aldeia</span>
          </Button>
          <Button 
            variant="default"
            size="sm" 
            onClick={() => setShowQuiz(true)}
            className="flex flex-col gap-1 h-auto py-2 bg-primary text-primary-foreground"
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-xs font-body">Quiz</span>
          </Button>
          <Button 
            variant={view === "map" ? "default" : "ghost"} 
            size="sm" 
            onClick={() => setView("map")}
            className="flex flex-col gap-1 h-auto py-2"
          >
            <Map className="w-5 h-5" />
            <span className="text-xs font-body">Mapa</span>
          </Button>
          <Button 
            variant={view === "chat" ? "default" : "ghost"} 
            size="sm" 
            onClick={() => setView("chat")}
            className="flex flex-col gap-1 h-auto py-2"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs font-body">Chat</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={async () => { await signOut(); navigate("/"); }}
            className="flex flex-col gap-1 h-auto py-2"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs font-body">Sair</span>
          </Button>
        </div>
      </div>

      {/* Modals */}
      {showQuiz && (
        <QuizModal 
          student={studentData} 
          onClose={() => { setShowQuiz(false); refreshProfile(); }} 
        />
      )}

      <ShopModal
        open={showShop}
        onOpenChange={setShowShop}
        studentId={studentData.id}
        coins={studentData.coins}
        diamonds={studentData.diamonds}
        villageLevel={studentData.village_level}
        onPurchase={refreshProfile}
      />

      <BattleModal
        open={showBattle}
        onOpenChange={setShowBattle}
        studentId={studentData.id}
        defenseLevel={studentData.defense_level}
        isPremium={studentData.is_premium}
        onBattleEnd={handleBattleEnd}
        onAnswerQuestion={handleBattleAnswerQuestion}
      />

      <MonthlyTestModal
        open={showMonthlyTest}
        onOpenChange={setShowMonthlyTest}
        studentId={studentData.id}
        schoolYear={studentData.school_year}
        onTestComplete={handleClaimMissionReward}
        onStartTest={handleMonthlyTestStart}
      />
      </div>
    </AccessibilityWrapper>
  );
};

export default GamePage;