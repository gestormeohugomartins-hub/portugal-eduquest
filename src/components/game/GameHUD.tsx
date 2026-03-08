import { Coins, Diamond, Users } from "lucide-react";

interface GameHUDProps {
  student: {
    display_name: string;
    school_year: string;
    coins: number;
    diamonds: number;
    citizens: number;
    village_level: number;
    xp: number;
  };
}

export const GameHUD = ({ student }: GameHUDProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b-2 border-border">
      <div className="flex items-center justify-between px-4 py-2 max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="font-display text-sm font-bold text-primary-foreground">
              {student.display_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-body text-sm font-bold leading-tight">{student.display_name}</p>
            <p className="font-body text-xs text-muted-foreground">
              {student.school_year}º Ano • Nível {student.village_level}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gold/20 px-2 py-1 rounded-lg">
            <Coins className="w-4 h-4 text-gold" />
            <span className="font-body text-xs font-bold">{student.coins}</span>
          </div>
          <div className="flex items-center gap-1 bg-diamond/20 px-2 py-1 rounded-lg">
            <Diamond className="w-4 h-4 text-diamond" />
            <span className="font-body text-xs font-bold">{student.diamonds}</span>
          </div>
          <div className="flex items-center gap-1 bg-citizen/20 px-2 py-1 rounded-lg">
            <Users className="w-4 h-4 text-citizen" />
            <span className="font-body text-xs font-bold">{student.citizens}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
