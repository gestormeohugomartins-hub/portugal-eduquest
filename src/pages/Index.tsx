import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import villageHero from "@/assets/village-hero.png";
import { Button } from "@/components/ui/button";
import { Shield, BookOpen, Users, Map } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${villageHero})` }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-4">
          <img 
            src={logo} 
            alt="Questeduca" 
            className="w-64 md:w-80 mb-8 animate-float drop-shadow-2xl"
          />
          <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground text-center mb-4 text-shadow-game">
            Aprende, Constrói, Defende!
          </h1>
          <p className="font-body text-lg md:text-xl text-muted-foreground text-center max-w-2xl mb-8">
            O jogo educativo que transforma o estudo em aventura! Constrói a tua aldeia, 
            responde a perguntas e protege-a de monstros e aliens!
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground font-bold text-lg px-8 py-6 animate-pulse-gold"
              onClick={() => navigate("/register")}
            >
              🏰 Começar Aventura
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-2 border-foreground/20 font-bold text-lg px-8 py-6"
              onClick={() => navigate("/login")}
            >
              ⚔️ Continuar Aventura
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: BookOpen, title: "Aprender", desc: "Perguntas do 1º ao 4º ano seguindo o currículo nacional", color: "bg-accent text-accent-foreground" },
            { icon: Shield, title: "Construir", desc: "Constrói e melhora a tua aldeia com as moedas que ganhas", color: "bg-secondary text-secondary-foreground" },
            { icon: Users, title: "Socializar", desc: "Faz amigos, visita aldeias e ajuda colegas em todo o Portugal", color: "bg-primary text-primary-foreground" },
            { icon: Map, title: "Explorar", desc: "Mapa de Portugal com aldeias de todos os jogadores por distrito", color: "bg-diamond text-diamond-foreground" },
          ].map((feature, i) => (
            <div
              key={feature.title}
              className="parchment-bg game-border p-6 text-center animate-slide-up"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className={`w-16 h-16 ${feature.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">{feature.title}</h3>
              <p className="font-body text-muted-foreground text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Parental Control Banner */}
      <div className="py-12 px-4 parchment-bg">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
            🛡️ Controlo Parental Total
          </h2>
          <p className="font-body text-muted-foreground mb-6 max-w-2xl mx-auto">
            Os pais registam-se primeiro, autorizam os emails dos educandos, monitorizam amizades, 
            conversas e evolução escolar. Podem definir prioridades por disciplina.
          </p>
          <Button 
            variant="outline" 
            size="lg"
            className="border-2 border-foreground/20 font-bold"
            onClick={() => navigate("/register")}
          >
            Saber Mais sobre Controlo Parental
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 px-4 text-center">
        <p className="font-body text-sm text-muted-foreground">
          Questeduca © 2026 — Jogo educativo para o 1º Ciclo do Ensino Básico
        </p>
      </footer>
    </div>
  );
};

export default Index;
