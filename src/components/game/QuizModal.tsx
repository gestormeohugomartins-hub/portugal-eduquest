import { useState, useEffect } from "react";
import { getRandomQuestions, Question } from "@/data/questions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Coins, Diamond, Users } from "lucide-react";

interface QuizModalProps {
  student: {
    id: string;
    user_id: string;
    school_year: string;
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

  useEffect(() => {
    const q = getRandomQuestions(student.school_year, 5);
    setQuestions(q);
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
      // Award resources
      if (correctCount >= 3) {
        const rewardAmount = Math.round(reward.amount * (correctCount / 5));
        const updateData: Record<string, number> = {};
        
        // Get current values
        const { data: currentStudent } = await supabase
          .from("students")
          .select("coins, diamonds, citizens, xp")
          .eq("id", student.id)
          .single();

        if (currentStudent) {
          if (reward.type === "coins") {
            updateData.coins = currentStudent.coins + rewardAmount;
          } else if (reward.type === "diamonds") {
            updateData.diamonds = currentStudent.diamonds + rewardAmount;
          } else {
            updateData.citizens = currentStudent.citizens + rewardAmount;
          }
          updateData.xp = currentStudent.xp + correctCount * 10;

          await supabase.from("students").update(updateData).eq("id", student.id);
        }
      }
    }
  };

  if (!questions.length) return null;

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="fixed inset-0 bg-foreground/60 z-[60] flex items-center justify-center px-4">
      <div className="w-full max-w-lg game-border p-6 bg-card relative animate-slide-up max-h-[90vh] overflow-y-auto">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2"
          onClick={onClose}
        >
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
                  +{Math.round(reward.amount * (correctCount / 5))} {reward.label}
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
                <div className="flex items-center gap-1">
                  <reward.icon className={`w-4 h-4 ${reward.color}`} />
                  <span className="font-body text-xs">Prémio: {reward.label}</span>
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
