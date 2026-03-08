import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "O que é o Questeduca?",
    answer: "O Questeduca é um jogo educativo online para crianças do 1º ao 4º ano do ensino básico. Combina aprendizagem com diversão através de perguntas do currículo nacional, construção de aldeias virtuais e interação social segura."
  },
  {
    question: "Como funciona o jogo?",
    answer: "Os alunos respondem a perguntas de Português, Matemática, Estudo do Meio e Inglês. Ao acertar, ganham moedas e diamantes que podem usar para construir e melhorar a sua aldeia. Quanto mais estudam, mais a aldeia cresce!"
  },
  {
    question: "O jogo é seguro para crianças?",
    answer: "Sim! O Questeduca foi desenhado com a segurança em primeiro lugar. Os pais registam-se primeiro e autorizam os emails dos educandos. Todas as amizades e conversas são monitorizadas pelos encarregados de educação através do painel parental."
  },
  {
    question: "Como é feito o controlo parental?",
    answer: "Os pais têm acesso a um painel completo onde podem ver o progresso escolar, aprovar pedidos de amizade, ler conversas, definir prioridades de disciplinas e gerir as contas dos educandos."
  },
  {
    question: "Qual a diferença entre a versão gratuita e premium?",
    answer: "Na versão gratuita, os alunos podem evoluir até 50% de cada ano escolar. A versão premium (€1,99/mês ou €21,49/ano21,49/ano) desbloqueia 100% do conteúdo, permitindo completar todo o ano e progredir automaticamente. A progressão de ano é automática durante as férias de verão."
  },
  {
    question: "Quanto custa o Questeduca Premium?",
    answer: "O Questeduca Premium 1,99/mês ou €21,49/ano (poupa 10%). Este valor desbloqueia todo o conteúd�do do ano, incluindo progressão automática para o ano seguinte durante as férias de verão."
  },
  {
    question: "As perguntas seguem o currículo nacional?",
    answer: "Sim! Todas as perguntas são baseadas no currículo nacional do 1º ciclo do ensino básico português, organizadas por ano de escolaridade e disciplina."
  },
  {
    question: "O que acontece nas férias de verão?",
    answer: "Durante as férias, as perguntas são de revisão e abrangem toda a matéria do ano transato. Quando o novo ano letivo começa (conforme data do Ministério da Educação), as perguntas do novo ano incluem explicações e ajudas durante os primeiros 30 dias."
  },
  {
    question: "O que acontece ao terminar o 4º ano?",
    answer: "Ao completar o 4º ano, o jogador pode continuar a jogar! Pode melhorar a sua cidade, competir nos rankings, fazer batalhas e continuar a socializar com amigos."
  },
  {
    question: "Como posso encontrar amigos da minha escola?",
    answer: "No registo, cada aluno seleciona a sua escola a partir da lista oficial de escolas do 1º ciclo em Portugal. Isto permite procurar amigos da mesma escola, agrupamento escolar ou distrito."
  },
  {
    question: "Como funciona o sistema de batalhas?",
    answer: "Monstros e alienígenas podem atacar a tua aldeia! Para os derrotar, precisas de responder corretamente a perguntas. Quanto mais fortes forem as tuas defesas e quanto mais perguntas acertares, mais fácil é ganhar."
  },
  {
    question: "O que são os testes mensais?",
    answer: "São testes facultativos disponíveis todos os meses que cobrem a matéria estudada. Se obtiveres uma pontuação superior a 80%, ganhas bónus especiais de moedas, diamantes e XP!"
  },
];

const FAQPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <img src={logo} alt="Questeduca" className="w-12" />
            <h1 className="font-display text-2xl font-bold">Perguntas Frequentes</h1>
          </div>
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {faqItems.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-card border border-border rounded-lg px-4"
            >
              <AccordionTrigger className="font-body font-semibold text-left hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="font-body text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-8 game-border bg-card p-6 text-center">
          <Crown className="w-10 h-10 text-gold mx-auto mb-3" />
          <h2 className="font-display text-xl font-bold mb-2">Questeduca Premium</h2>
          <p className="font-body text-muted-foreground mb-4">
            Desbloqueia 100% do conteúdo por apenas €4,99/ano escolar
          </p>
          <Button onClick={() => navigate("/register")} className="bg-primary text-primary-foreground font-bold">
            Começar Aventura
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
