import { Button } from "@/components/ui/button";
import { Shield, Home, Hammer, Sword, BookOpen } from "lucide-react";
import villageHero from "@/assets/village-hero.png";

interface VillageViewProps {
  student: {
    village_level: number;
    defense_level: number;
    citizens: number;
    school_year: string;
  };
  onQuiz: () => void;
}

const buildingTypes = [
  { name: "Casa", icon: Home, desc: "Abrigo para cidadãos", cost: 50 },
  { name: "Muralha", icon: Shield, desc: "Defende contra monstros", cost: 100 },
  { name: "Oficina", icon: Hammer, desc: "Produz recursos", cost: 75 },
  { name: "Torre", icon: Sword, desc: "Ataca invasores", cost: 150 },
];

export const VillageView = ({ student, onQuiz }: VillageViewProps) => {
  const maxBuildings = Math.min(student.village_level * 3, 12);
  const yearLabel = `${student.school_year}º Ano`;

  return (
    <div className="px-4">
      {/* Village Image */}
      <div className="relative rounded-xl overflow-hidden game-border mb-6">
        <img 
          src={villageHero} 
          alt="A tua aldeia" 
          className="w-full h-48 md:h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
          <div>
            <h2 className="font-display text-xl font-bold text-card text-shadow-game">
              A Tua Aldeia
            </h2>
            <p className="font-body text-sm text-card/80">
              Nível {student.village_level} • {student.citizens} cidadãos • {yearLabel}
            </p>
          </div>
          <Button
            size="sm"
            onClick={onQuiz}
            className="bg-primary text-primary-foreground font-bold animate-pulse-gold"
          >
            <BookOpen className="w-4 h-4 mr-1" />
            Quiz
          </Button>
        </div>
      </div>

      {/* Buildings Grid */}
      <div>
        <h3 className="font-display text-lg font-bold mb-3">Construções</h3>
        <p className="font-body text-sm text-muted-foreground mb-4">
          Responde a perguntas para ganhar moedas e construir! ({maxBuildings} edifícios máx.)
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {buildingTypes.map(building => (
            <div key={building.name} className="parchment-bg game-border p-4 text-center">
              <building.icon className="w-8 h-8 mx-auto mb-2 text-wood" />
              <h4 className="font-body text-sm font-bold">{building.name}</h4>
              <p className="font-body text-xs text-muted-foreground mb-2">{building.desc}</p>
              <div className="flex items-center justify-center gap-1 text-xs font-bold text-gold-foreground">
                <span>🪙 {building.cost}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Defense Status */}
      <div className="mt-6 parchment-bg game-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-secondary" />
              Defesas
            </h3>
            <p className="font-body text-sm text-muted-foreground">
              Nível {student.defense_level} — Protege contra monstros e aliens!
            </p>
          </div>
          <div className="text-right">
            <p className="font-body text-2xl font-bold text-secondary">{student.defense_level * 10}%</p>
            <p className="font-body text-xs text-muted-foreground">Proteção</p>
          </div>
        </div>
      </div>
    </div>
  );
};
