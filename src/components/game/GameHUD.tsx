import { Coins, Diamond, Users } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { getSettlementType } from "@/lib/gameTypes";

interface Notification {
  id: string;
  title: string;
  message: string;
  icon: string;
  type: string;
  read: boolean;
  created_at: string;
}

interface GameHUDProps {
  student: {
    display_name: string;
    nickname?: string | null;
    school_year: string;
    coins: number;
    diamonds: number;
    citizens: number;
    village_level: number;
    xp: number;
  };
  notifications?: Notification[];
  unreadCount?: number;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
}

export const GameHUD = ({ student, notifications = [], unreadCount = 0, onMarkAsRead, onMarkAllAsRead }: GameHUDProps) => {
  const settlement = getSettlementType(student.village_level);
  const villageName = student.nickname || student.display_name;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b-2 border-border safe-top">
      <div className="flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-2 max-w-4xl mx-auto">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-shrink">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="font-display text-xs sm:text-sm font-bold text-primary-foreground">
              {villageName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-body text-xs sm:text-sm font-bold leading-tight truncate max-w-[100px] sm:max-w-none">
              {settlement.emoji} {villageName}
            </p>
            <p className="font-body text-[10px] sm:text-xs text-muted-foreground">
              {settlement.name} • {student.school_year}º Ano • Nv {student.village_level}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-0.5 sm:gap-1 bg-gold/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg">
            <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-gold" />
            <span className="font-body text-[10px] sm:text-xs font-bold">{student.coins}</span>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 bg-diamond/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg">
            <Diamond className="w-3 h-3 sm:w-4 sm:h-4 text-diamond" />
            <span className="font-body text-[10px] sm:text-xs font-bold">{student.diamonds}</span>
          </div>
          <div className="hidden xs:flex items-center gap-0.5 sm:gap-1 bg-citizen/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-citizen" />
            <span className="font-body text-[10px] sm:text-xs font-bold">{student.citizens}</span>
          </div>
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={onMarkAsRead || (() => {})}
            onMarkAllAsRead={onMarkAllAsRead || (() => {})}
          />
        </div>
      </div>
    </div>
  );
};
