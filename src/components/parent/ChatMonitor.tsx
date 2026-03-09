import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface ChatMonitorProps {
  parentId: string;
  children: { id: string; display_name: string; nickname?: string }[];
}

interface Message {
  id: string;
  message: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
}

export const ChatMonitor = ({ parentId, children: kids }: ChatMonitorProps) => {
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (kids.length === 0) return;
    const kidIds = kids.map(k => k.id);

    const loadMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .or(kidIds.map(id => `sender_id.eq.${id}`).join(",") + "," + kidIds.map(id => `receiver_id.eq.${id}`).join(","))
        .order("created_at", { ascending: false })
        .limit(200);

      if (!data) return;

      // Group by child
      const grouped: Record<string, Message[]> = {};
      kidIds.forEach(id => { grouped[id] = []; });
      data.forEach(msg => {
        const childId = kidIds.find(id => id === msg.sender_id || id === msg.receiver_id);
        if (childId) grouped[childId].push(msg);
      });
      setMessages(grouped);

      // Get all unique non-child player IDs
      const otherIds = [...new Set(data.flatMap(m => [m.sender_id, m.receiver_id]).filter(id => !kidIds.includes(id)))];
      if (otherIds.length > 0) {
        const { data: players } = await supabase
          .from("students")
          .select("id, nickname, display_name")
          .in("id", otherIds);
        const map: Record<string, string> = {};
        kids.forEach(k => { map[k.id] = k.nickname || k.display_name; });
        players?.forEach(p => { map[p.id] = p.nickname || p.display_name; });
        setPlayerNames(map);
      } else {
        const map: Record<string, string> = {};
        kids.forEach(k => { map[k.id] = k.nickname || k.display_name; });
        setPlayerNames(map);
      }
    };

    loadMessages();
  }, [kids]);

  if (kids.length === 0) {
    return (
      <div className="text-center py-6">
        <MessageCircle className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
        <p className="font-body text-sm text-muted-foreground">Sem educandos registados.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h3 className="font-display text-lg font-bold">Monitor de Chat</h3>
      </div>
      <p className="font-body text-xs text-muted-foreground mb-4">
        Veja as conversas dos seus educandos em tempo real.
      </p>

      <Tabs defaultValue={kids[0]?.id}>
        <TabsList className="w-full mb-3">
          {kids.map(k => (
            <TabsTrigger key={k.id} value={k.id} className="font-body text-xs flex-1">
              {k.nickname || k.display_name}
              {messages[k.id]?.length ? ` (${messages[k.id].length})` : ""}
            </TabsTrigger>
          ))}
        </TabsList>

        {kids.map(k => (
          <TabsContent key={k.id} value={k.id}>
            {(!messages[k.id] || messages[k.id].length === 0) ? (
              <p className="font-body text-sm text-muted-foreground text-center py-4">
                Sem mensagens.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {messages[k.id].map(msg => {
                  const isChild = msg.sender_id === k.id;
                  return (
                    <div key={msg.id} className={`flex ${isChild ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-lg px-3 py-2 ${isChild ? "bg-primary/10" : "bg-muted"}`}>
                        <p className="font-body text-[10px] text-muted-foreground mb-0.5">
                          {playerNames[msg.sender_id] || "Jogador"} • {format(new Date(msg.created_at), "dd/MM HH:mm")}
                        </p>
                        <p className="font-body text-sm">{msg.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
