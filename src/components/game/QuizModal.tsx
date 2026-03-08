import { useState, useEffect } from "react";
import { getRandomQuestions, Question } from "@/data/questions";
import { supabase } from "@/integrations/supabase/client";
import { BUILDING_DEFS } from "@/lib/gameTypes";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Coins, Diamond, Users, Crown, HelpCircle } from "lucide-react";
import { getCurrentSchoolPeriod, isAtFreeCap } from "@/lib/schoolYear";

interface QuizModalProps {
  student: {
    id: string;
    user_id: string;
    school_year: string;
    is_premium?: boolean;
    xp?: number;
  };
  onClose: () => void;
}

const rewardTypes = [
  { type: "coins", icon: Coins, label: "Moedas", amount: 20, color: "text-gold" },
  { type: "diamonds", icon: Diamond, label: "Diamantes", amount: 5, color: "text-diamond" },
  { type: "citizens", icon: Users, label: "Cidadãos", amount: 2, color: "text-citizen" },
];

export const QuizModal = ({ student, onClose }: QuizModalProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [reward, setReward] = useState(rewardTypes[0]);
  const [atCap, setAtCap] = useState(false);

  const schoolPeriod = getCurrentSchoolPeriod();
  const isPremium = (student as any).is_premium || false;
  const studentXp = (student as any).xp || 0;

  useEffect(() => {
    // Check if at free cap
    if (isAtFreeCap(studentXp, student.school_year, isPremium)) {
      setAtCap(true);
      return;
    }

    const loadQuestions = async () => {
      // Get base curriculum questions (4 out of 5)
      const baseQuestions = getRandomQuestions(student.school_year, 4);

      // Try to fetch a monument question for buildings the player has built
      let monumentQuestion: Question | null = null;
      try {
        const { data: playerBuildings } = await supabase
          .from("buildings")
          .select("building_type")
          .eq("student_id", student.id);

        if (playerBuildings && playerBuildings.length > 0) {
          // Get building types that are monuments
          const builtMonumentIds = playerBuildings
            .map(b => b.building_type)
            .filter(bt => BUILDING_DEFS[bt]?.category === "monument");

          if (builtMonumentIds.length > 0) {
            // Get monument_info IDs for these buildings
            const { data: monumentInfos } = await supabase
              .from("monument_info")
              .select("id, building_def_id")
              .in("building_def_id", builtMonumentIds);

            if (monumentInfos && monumentInfos.length > 0) {
              const monumentInfoIds = monumentInfos.map(m => m.id);
              
              // Fetch a random monument question matching school year
              const { data: mQuestions } = await supabase
                .from("monument_questions")
                .select("*")
                .in("monument_id", monumentInfoIds)
                .eq("school_year", student.school_year)
                .limit(10);

              if (mQuestions && mQuestions.length > 0) {
                const randomMQ = mQuestions[Math.floor(Math.random() * mQuestions.length)];
                const mInfo = monumentInfos.find(m => m.id === randomMQ.monument_id);
                monumentQuestion = {
                  id: randomMQ.id,
                  school_year: student.school_year as "1" | "2" | "3" | "4",
                  subject: "estudo_meio",
                  question_text: `🏛️ ${randomMQ.question_text}`,
                  options: randomMQ.options as string[],
                  correct_answer: randomMQ.correct_answer,
                  difficulty: randomMQ.difficulty,
                };
              }
            }
          }
        }
      } catch (err) {
        console.error("Error fetching monument questions:", err);
      }

      // Combine: 4 base + 1 monument (or 5 base if no monument)
      let allQuestions: Question[];
      if (monumentQuestion) {
        allQuestions = [...baseQuestions, monumentQuestion].sort(() => Math.random() - 0.5);
      } else {
        allQuestions = getRandomQuestions(student.school_year, 5);
      }
      
      setQuestions(allQuestions);
    };

    loadQuestions();
    setReward(rewardTypes[Math.floor(Math.random() * rewardTypes.length)]);
  }, [student.school_year]);

  const handleAnswer = (answerIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    if (answerIndex === questions[currentIndex].correct_answer) {
      setCorrectCount(prev => prev + 1);
    }
  };

  const handleNext = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizComplete(true);
      if (correctCount >= 3) {
        const premiumMultiplier = isPremium ? 1.15 : 1;
        const rewardAmount = Math.round(reward.amount * (correctCount / 5) * premiumMultiplier);
        const xpGain = Math.round(correctCount * 10 * premiumMultiplier);
        const { data: currentStudent } = await supabase
          .from("students")
          .select("coins, diamonds, citizens, xp")
          .eq("id", student.id)
          .single();

        if (currentStudent) {
          const updateData: Record<string, number> = {};
          if (reward.type === "coins") updateData.coins = currentStudent.coins + rewardAmount;
          else if (reward.type === "diamonds") updateData.diamonds = currentStudent.diamonds + rewardAmount;
          else updateData.citizens = currentStudent.citizens + rewardAmount;
          updateData.xp = currentStudent.xp + xpGain;

          await supabase.from("students").update(updateData).eq("id", student.id);
        }
      }
    }
  };

  // Free cap reached
  if (atCap) {
    return (
      <div className="fixed inset-0 bg-foreground/60 z-[60] flex items-center justify-center px-4">
        <div className="w-full max-w-lg game-border p-6 bg-card relative animate-slide-up">
          <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
          <div className="text-center py-8">
            <Crown className="w-16 h-16 text-gold mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold mb-3">Limite Gratuito Atingido!</h2>
            <p className="font-body text-muted-foreground mb-4">
              Chegaste aos 50% de evolução do {student.school_year}º ano na versão gratuita.
            </p>
            <p className="font-body text-muted-foreground mb-6">
              Para continuares a evoluir e desbloquear 100% do conteúdo, ativa o <strong>Questeduca Premium</strong> a partir de <strong>€1,99/mês</strong>.
            </p>
            <Button 
              className="bg-gold text-foreground font-bold px-8 py-3"
              onClick={async () => {
                try {
                  const { data, error } = await supabase.functions.invoke("create-checkout", {
                    body: { studentId: student.id, plan: "monthly" },
                  });
                  if (error) throw error;
                  if (data?.url) window.open(data.url, "_blank");
                } catch (err: any) {
                  console.error("Checkout error:", err);
                }
              }}
            >
              <Crown className="w-5 h-5 mr-2" />
              Ativar Premium — €1,99/mês
            </Button>
            <p className="font-body text-xs text-muted-foreground mt-3">
              Pede ao teu encarregado de educação para ativar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!questions.length) return null;

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const showHelp = schoolPeriod === "new_year_help";
  const isReview = schoolPeriod === "review";

  return (
    <div className="fixed inset-0 bg-foreground/60 z-[60] flex items-center justify-center px-4">
      <div className="w-full max-w-lg game-border p-6 bg-card relative animate-slide-up max-h-[90vh] overflow-y-auto">
        <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>

        {quizComplete ? (
          <div className="text-center py-8">
            <p className="font-display text-2xl font-bold mb-2">
              {correctCount >= 3 ? "🎉 Parabéns!" : "📚 Tenta outra vez!"}
            </p>
            <p className="font-body text-lg mb-4">
              Acertaste {correctCount} de {questions.length}!
            </p>
            {correctCount >= 3 && (
              <div className="parchment-bg rounded-lg p-4 inline-flex items-center gap-2">
                <reward.icon className={`w-6 h-6 ${reward.color}`} />
                <span className="font-body font-bold">
                  +{Math.round(reward.amount * (correctCount / 5) * (isPremium ? 1.15 : 1))} {reward.label}
                  {isPremium && <span className="text-gold text-xs ml-1">(+15%)</span>}
                </span>
              </div>
            )}
            <div className="mt-6">
              <Button onClick={onClose} className="bg-primary text-primary-foreground font-bold">
                Voltar à Aldeia
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-body text-sm font-bold">
                  Pergunta {currentIndex + 1}/{questions.length}
                </span>
                <div className="flex items-center gap-2">
                  {isReview && (
                    <span className="text-xs px-2 py-0.5 bg-accent rounded font-body">📖 Revisão</span>
                  )}
                  {showHelp && (
                    <span className="text-xs px-2 py-0.5 bg-secondary/20 rounded font-body text-secondary">💡 Com Ajuda</span>
                  )}
                  <div className="flex items-center gap-1">
                    <reward.icon className={`w-4 h-4 ${reward.color}`} />
                    <span className="font-body text-xs">Prémio: {reward.label}</span>
                  </div>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="mb-2">
              <span className="text-xs font-body px-2 py-1 rounded bg-accent text-accent-foreground">
                {currentQuestion.subject === "portugues" ? "Português" :
                 currentQuestion.subject === "matematica" ? "Matemática" :
                 currentQuestion.subject === "estudo_meio" ? "Estudo do Meio" : "Inglês"}
              </span>
            </div>

            <h2 className="font-body text-lg font-bold mb-4">{currentQuestion.question_text}</h2>

            {/* Help hint during new year period */}
            {showHelp && (
              <div className="mb-4 p-3 bg-secondary/10 border border-secondary/30 rounded-lg flex items-start gap-2">
                <HelpCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                <p className="font-body text-sm text-muted-foreground">
                  <strong>Dica:</strong> A resposta correta é a opção <strong>{String.fromCharCode(65 + currentQuestion.correct_answer)}</strong>. 
                  Estamos no início do ano letivo — aproveita para aprender!
                </p>
              </div>
            )}

            <div className="space-y-2 mb-4">
              {currentQuestion.options.map((option, i) => {
                let btnClass = "w-full text-left justify-start py-3 px-4 font-body border-2 ";
                if (showResult) {
                  if (i === currentQuestion.correct_answer) btnClass += "border-secondary bg-secondary/20 ";
                  else if (i === selectedAnswer) btnClass += "border-destructive bg-destructive/20 ";
                  else btnClass += "border-border opacity-50 ";
                } else {
                  btnClass += "border-border hover:border-primary ";
                }
                return (
                  <Button key={i} variant="outline" className={btnClass} onClick={() => handleAnswer(i)} disabled={showResult}>
                    <span className="mr-2 font-bold text-primary">{String.fromCharCode(65 + i)}.</span>
                    {option}
                  </Button>
                );
              })}
            </div>

            {showResult && (
              <div className="text-center">
                <p className={`font-body font-bold mb-2 ${selectedAnswer === currentQuestion.correct_answer ? "text-secondary" : "text-destructive"}`}>
                  {selectedAnswer === currentQuestion.correct_answer ? "✅ Correto!" : "❌ Incorreto!"}
                </p>
                <Button onClick={handleNext} className="bg-primary text-primary-foreground font-bold">
                  {currentIndex + 1 < questions.length ? "Próxima ➡️" : "Ver Resultado 🏆"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
