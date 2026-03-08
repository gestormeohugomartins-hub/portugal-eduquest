import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { BookOpen, Coins, Diamond, Star, CheckCircle, Trophy } from "lucide-react";

interface MonthlyTest {
  id: string;
  title: string;
  description: string;
  school_year: string;
  subject: string;
  month: number;
  year: number;
  question_count: number;
  bonus_coins: number;
  bonus_diamonds: number;
  bonus_xp: number;
}

interface TestResult {
  test_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  bonus_earned: boolean;
}

interface MonthlyTestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  schoolYear: string;
  onTestComplete: (coins: number, diamonds: number, xp: number) => void;
  onStartTest: (testId: string, questionCount: number) => void;
}

const subjectLabels: Record<string, string> = {
  portugues: "Português",
  matematica: "Matemática",
  estudo_meio: "Estudo do Meio",
  ingles: "Inglês",
};

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const MonthlyTestModal = ({
  open,
  onOpenChange,
  studentId,
  schoolYear,
  onTestComplete,
  onStartTest,
}: MonthlyTestModalProps) => {
  const [tests, setTests] = useState<MonthlyTest[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchTests();
    }
  }, [open, studentId, schoolYear]);

  const fetchTests = async () => {
    setLoading(true);
    
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const [testsRes, resultsRes] = await Promise.all([
      supabase
        .from("monthly_tests")
        .select("*")
        .eq("school_year", schoolYear as any)
        .eq("is_active", true)
        .lte("month", currentMonth)
        .eq("year", currentYear)
        .order("month", { ascending: false }),
      supabase
        .from("monthly_test_results")
        .select("test_id, score, total_questions, percentage, bonus_earned")
        .eq("student_id", studentId),
    ]);

    if (testsRes.data) setTests(testsRes.data as MonthlyTest[]);
    if (resultsRes.data) setResults(resultsRes.data);
    
    setLoading(false);
  };

  const getTestResult = (testId: string) => results.find(r => r.test_id === testId);

  const handleStartTest = (test: MonthlyTest) => {
    onStartTest(test.id, test.question_count);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Testes Mensais
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground mb-4">
          Completa testes mensais opcionais para ganhar bónus extra! 
          Precisas de pelo menos 80% para receber o bónus.
        </p>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">A carregar...</div>
        ) : tests.length === 0 ? (
          <Card className="p-6 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-display font-bold mb-1">Sem Testes Disponíveis</h3>
            <p className="text-sm text-muted-foreground">
              Os testes mensais serão disponibilizados em breve.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {tests.map(test => {
              const result = getTestResult(test.id);
              const completed = !!result;
              const passedBonus = result && result.percentage >= 80;

              return (
                <Card 
                  key={test.id} 
                  className={`p-4 ${completed ? (passedBonus ? "border-green-500" : "border-muted") : ""}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-body font-semibold">{test.title}</h4>
                        <Badge variant="outline">{subjectLabels[test.subject]}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {monthNames[test.month - 1]} {test.year} • {test.question_count} perguntas
                      </p>
                    </div>
                    {completed && (
                      <Badge className={passedBonus ? "bg-green-500" : "bg-muted"}>
                        {passedBonus ? <><CheckCircle className="w-3 h-3 mr-1" /> Bónus</> : "Completo"}
                      </Badge>
                    )}
                  </div>

                  {completed ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Resultado: {result.score}/{result.total_questions}</span>
                        <span className={result.percentage >= 80 ? "text-green-500" : "text-muted-foreground"}>
                          {result.percentage.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={result.percentage} className="h-2" />
                      {passedBonus && (
                        <div className="flex items-center gap-3 text-xs text-green-500 mt-2">
                          <Trophy className="w-4 h-4" />
                          <span>Bónus recebido!</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Coins className="w-3 h-3 text-gold" /> +{test.bonus_coins}
                        </span>
                        <span className="flex items-center gap-1">
                          <Diamond className="w-3 h-3 text-diamond" /> +{test.bonus_diamonds}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-primary" /> +{test.bonus_xp} XP
                        </span>
                      </div>
                      <Button 
                        onClick={() => handleStartTest(test)}
                        className="w-full"
                      >
                        📝 Iniciar Teste
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};