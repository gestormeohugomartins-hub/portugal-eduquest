import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Lock } from "lucide-react";

interface ChatPanelProps {
  studentId: string;
}

export const ChatPanel = ({ studentId }: ChatPanelProps) => {
  const [message, setMessage] = useState("");

  return (
    <div className="px-4">
      <h2 className="font-display text-xl font-bold mb-4 text-center">💬 Chat</h2>

      <div className="game-border bg-card p-6 text-center">
        <Lock className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <h3 className="font-display text-lg font-bold mb-2">Chat Seguro</h3>
        <p className="font-body text-sm text-muted-foreground mb-4">
          Para conversar com outros jogadores, primeiro precisas de:
        </p>
        <ol className="font-body text-sm text-muted-foreground text-left max-w-xs mx-auto space-y-2">
          <li className="flex items-start gap-2">
            <span className="font-bold text-primary">1.</span>
            Enviar um pedido de amizade
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-primary">2.</span>
            O pai/encarregado de ambos deve aprovar
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-primary">3.</span>
            Depois podes conversar com segurança!
          </li>
        </ol>
        
        <div className="mt-6 parchment-bg rounded-lg p-4">
          <p className="font-body text-xs text-muted-foreground">
            🛡️ Todas as conversas são monitorizadas pelo controlo parental
          </p>
        </div>
      </div>
    </div>
  );
};
