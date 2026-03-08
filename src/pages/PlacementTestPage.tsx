import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getRandomQuestions, Question } from "@/data/questions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const PlacementTestPage = () => {
  const navigate = useNavigate();
  const { studentData, user, refreshProfile } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [currentYear, setCurrentYear] = useState(1);
  const [yearResults, setYearResults] = useState<Record<number, number>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [testComplete, setTestComplete] = useState(false);

  const targetYear = studentData ? parseInt(studentData.school_year) : 1;

  useEffect(() => {
    if (!studentData || !user) {
      navigate("/login");
      return;
    }
    if (targetYear === 1) {
      // No placement test for 1st year
      navigate("/game");
      return;
    }
    loadYearQuestions(1);
  }, [studentData]);

  const loadYearQuestions = (year: number) => {
    const q = getRandomQuestions(year.toString(), 10);
    setQuestions(q);
    setCurrentIndex(0);
    setCorrectCount(0);
    setCurrentYear(year);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleAnswer = (answerIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
    setShowResult(true);

    const isCorrect = answerIndex === questions[currentIndex].correct_answer;
    if (isCorrect) setCorrectCount(prev => prev + 1);
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Year completed
      const percentage = ((correctCount + (selectedAnswer === questions[currentIndex].correct_answer ? 0 : 0)) / questions.length) * 100;
      const finalCorrect = correctCount;
      const finalPercentage = (finalCorrect / questions.length) * 100;
      
      const newResults = { ...yearResults, [currentYear]: finalPercentage };
      setYearResults(newResults);

      if (finalPercentage < 80) {
        // Failed - start at previous year level
        finishTest(Math.max(1, currentYear - 1));
      } else if (currentYear + 1 < targetYear) {
        // Passed - continue to next year
        loadYearQuestions(currentYear + 1);
        toast.success(`${currentYear}º ano aprovado! Vamos ao ${currentYear + 1}º ano.`);
      } else {
        // All years passed
        finishTest(targetYear);
      }
    }
  };

  const finishTest = async (startLevel: number) => {
    setTestComplete(true);
    if (user && studentData) {
      await supabase.from("students").update({ 
        school_year: startLevel.toString() as any,
        xp: 1 
      }).eq("user_id", user.id);
      await refreshProfile();
      toast.success(`Teste concluído! Vais começar no ${startLevel}º ano.`);
      setTimeout(() => navigate("/game"), 2000);
    }
  };

  if (!questions.length) return null;

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 parchment-bg">
      <div className="w-full max-w-xl game-border p-8 bg-card">
        <div className="text-center mb-6">
          <img src={logo} alt="Questeduca" className="w-20 mx-auto mb-3" />
          <h1 className="font-display text-xl font-bold">Teste de Posicionamento</h1>
          <p className="font-body text-sm text-muted-foreground">
            A testar o {currentYear}º ano — Pergunta {currentIndex + 1} de {questions.length}
          </p>
          <Progress value={progress} className="mt-3 h-3" />
        </div>

        {testComplete ? (
          <div className="text-center py-8">
            <p className="font-display text-2xl font-bold mb-4">🎉 Teste Concluído!</p>
            <p className="font-body text-muted-foreground">A redirecionar para o jogo...</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex gap-2 mb-3">
                <span className="text-xs font-body px-2 py-1 rounded bg-accent text-accent-foreground">
                  {currentQuestion.subject === "portugues" ? "Português" :
                   currentQuestion.subject === "matematica" ? "Matemática" :
                   currentQuestion.subject === "estudo_meio" ? "Estudo do Meio" : "Inglês"}
                </span>
              </div>
              <h2 className="font-body text-lg font-bold">{currentQuestion.question_text}</h2>
            </div>

            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option, i) => {
                let btnClass = "w-full text-left justify-start py-4 px-4 font-body text-base border-2 ";
                if (showResult) {
                  if (i === currentQuestion.correct_answer) {
                    btnClass += "border-secondary bg-secondary/20 ";
                  } else if (i === selectedAnswer) {
                    btnClass += "border-destructive bg-destructive/20 ";
                  } else {
                    btnClass += "border-border opacity-50 ";
                  }
                } else {
                  btnClass += "border-border hover:border-primary ";
                }

                return (
                  <Button
                    key={i}
                    variant="outline"
                    className={btnClass}
                    onClick={() => handleAnswer(i)}
                    disabled={showResult}
                  >
                    <span className="mr-3 font-bold text-primary">{String.fromCharCode(65 + i)}.</span>
                    {option}
                  </Button>
                );
              })}
            </div>

            {showResult && (
              <div className="text-center">
                <p className={`font-body font-bold mb-3 ${selectedAnswer === currentQuestion.correct_answer ? "text-secondary" : "text-destructive"}`}>
                  {selectedAnswer === currentQuestion.correct_answer ? "✅ Correto!" : "❌ Incorreto!"}
                </p>
                <Button onClick={handleNext} className="bg-primary text-primary-foreground font-bold">
                  {currentIndex + 1 < questions.length ? "Próxima Pergunta ➡️" : "Concluir Ano ➡️"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PlacementTestPage;
