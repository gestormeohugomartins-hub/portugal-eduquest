import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { VillageView } from "@/components/game/VillageView";
import { GameHUD } from "@/components/game/GameHUD";
import { QuizModal } from "@/components/game/QuizModal";
import { PortugalMap } from "@/components/game/PortugalMap";
import { ChatPanel } from "@/components/game/ChatPanel";
import { Button } from "@/components/ui/button";
import { Map, MessageCircle, BookOpen, LogOut, Home } from "lucide-react";
import { useEffect } from "react";

type GameView = "village" | "map" | "chat";

const GamePage = () => {
  const { user, studentData, isStudent, loading, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<GameView>("village");
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
    if (!loading && user && !isStudent) navigate("/parent");
  }, [user, isStudent, loading]);

  if (loading || !studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center parchment-bg">
        <p className="font-display text-xl">A carregar o jogo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <GameHUD student={studentData} />

      {/* Main View */}
      <div className="pt-20 pb-20">
        {view === "village" && <VillageView student={studentData} onQuiz={() => setShowQuiz(true)} />}
        {view === "map" && <PortugalMap />}
        {view === "chat" && <ChatPanel studentId={studentData.id} />}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t-2 border-border z-50">
        <div className="flex justify-around items-center py-2 px-4 max-w-lg mx-auto">
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
            className="flex flex-col gap-1 h-auto py-2 bg-primary text-primary-foreground animate-pulse-gold"
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

      {/* Quiz Modal */}
      {showQuiz && (
        <QuizModal 
          student={studentData} 
          onClose={() => { setShowQuiz(false); refreshProfile(); }} 
        />
      )}
    </div>
  );
};

export default GamePage;
