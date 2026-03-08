import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeftRight, Check, X, Send } from 'lucide-react';

interface TradePanelProps {
  studentId: string;
  coins: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

interface Friend {
  id: string;
  display_name: string;
}

interface TradeOffer {
  id: string;
  sender_id: string;
  receiver_id: string;
  offer_coins: number;
  offer_food: number;
  request_coins: number;
  request_food: number;
  status: string;
  message: string | null;
  created_at: string;
  sender_name?: string;
  receiver_name?: string;
}

export const TradePanel = ({ studentId, coins, open, onOpenChange, onRefresh }: TradePanelProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [trades, setTrades] = useState<TradeOffer[]>([]);
  const [selectedFriend, setSelectedFriend] = useState('');
  const [offerCoins, setOfferCoins] = useState(0);
  const [offerFood, setOfferFood] = useState(0);
  const [requestCoins, setRequestCoins] = useState(0);
  const [requestFood, setRequestFood] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    loadFriends();
    loadTrades();
  }, [open, studentId]);

  const loadFriends = async () => {
    const { data: friendships } = await supabase
      .from('friendships')
      .select('requester_id, receiver_id')
      .eq('status', 'approved')
      .or(`requester_id.eq.${studentId},receiver_id.eq.${studentId}`);

    if (!friendships) return;
    const friendIds = friendships.map(f => f.requester_id === studentId ? f.receiver_id : f.requester_id);
    if (friendIds.length === 0) return;

    const { data: students } = await supabase
      .from('students')
      .select('id, display_name')
      .in('id', friendIds);

    setFriends(students || []);
  };

  const loadTrades = async () => {
    const { data } = await supabase
      .from('trade_offers')
      .select('*')
      .or(`sender_id.eq.${studentId},receiver_id.eq.${studentId}`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!data) return;

    // Enrich with names
    const allIds = [...new Set(data.flatMap(t => [t.sender_id, t.receiver_id]))];
    const { data: students } = await supabase.from('students').select('id, display_name').in('id', allIds);
    const nameMap = new Map(students?.map(s => [s.id, s.display_name]) || []);

    setTrades(data.map(t => ({
      ...t,
      sender_name: nameMap.get(t.sender_id) || '?',
      receiver_name: nameMap.get(t.receiver_id) || '?',
    })));
  };

  const sendOffer = async () => {
    if (!selectedFriend) { toast.error('Seleciona um amigo!'); return; }
    if (offerCoins === 0 && offerFood === 0 && requestCoins === 0 && requestFood === 0) {
      toast.error('Define pelo menos um recurso!'); return;
    }
    if (offerCoins > coins) { toast.error('Moedas insuficientes!'); return; }

    setSending(true);
    const { error } = await supabase.from('trade_offers').insert({
      sender_id: studentId,
      receiver_id: selectedFriend,
      offer_coins: offerCoins,
      offer_food: offerFood,
      request_coins: requestCoins,
      request_food: requestFood,
    });

    if (error) {
      toast.error('Erro ao enviar proposta!');
    } else {
      toast.success('Proposta enviada! 📦');
      setOfferCoins(0); setOfferFood(0); setRequestCoins(0); setRequestFood(0);
      loadTrades();
    }
    setSending(false);
  };

  const respondTrade = async (tradeId: string, accept: boolean) => {
    const trade = trades.find(t => t.id === tradeId);
    if (!trade) return;

    if (accept) {
      // Transfer resources: deduct from receiver what sender requests
      if (trade.request_coins > coins) {
        toast.error('Não tens moedas suficientes!'); return;
      }
      // Update sender: give request, take offer
      await supabase.from('students').update({
        coins: (coins - trade.request_coins + trade.offer_coins),
      }).eq('id', studentId);
    }

    await supabase.from('trade_offers').update({
      status: accept ? 'accepted' : 'rejected',
      resolved_at: new Date().toISOString(),
    }).eq('id', tradeId);

    toast.success(accept ? 'Troca aceite! 🤝' : 'Troca rejeitada.');
    loadTrades();
    onRefresh();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4" onClick={() => onOpenChange(false)}>
      <div className="bg-card rounded-xl p-4 max-w-md w-full max-h-[80vh] overflow-y-auto border-2 border-primary/30" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <ArrowLeftRight className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg font-bold">Trading 📦</h2>
        </div>

        {/* New Trade */}
        <div className="bg-muted/50 rounded-lg p-3 mb-4 space-y-2">
          <h3 className="text-sm font-bold">Nova Proposta</h3>
          <select
            className="w-full p-2 rounded bg-background border border-border text-sm"
            value={selectedFriend}
            onChange={e => setSelectedFriend(e.target.value)}
          >
            <option value="">Seleciona amigo...</option>
            {friends.map(f => (
              <option key={f.id} value={f.id}>{f.display_name}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-green-500">Ofereço:</span>
              <div className="flex items-center gap-1">
                <span>🪙</span>
                <input type="number" min={0} max={coins} value={offerCoins}
                  onChange={e => setOfferCoins(Math.max(0, +e.target.value))}
                  className="w-full p-1 rounded bg-background border border-border text-xs" />
              </div>
              <div className="flex items-center gap-1">
                <span>🍖</span>
                <input type="number" min={0} value={offerFood}
                  onChange={e => setOfferFood(Math.max(0, +e.target.value))}
                  className="w-full p-1 rounded bg-background border border-border text-xs" />
              </div>
            </div>
            <div className="space-y-1">
              <span className="font-bold text-blue-500">Peço:</span>
              <div className="flex items-center gap-1">
                <span>🪙</span>
                <input type="number" min={0} value={requestCoins}
                  onChange={e => setRequestCoins(Math.max(0, +e.target.value))}
                  className="w-full p-1 rounded bg-background border border-border text-xs" />
              </div>
              <div className="flex items-center gap-1">
                <span>🍖</span>
                <input type="number" min={0} value={requestFood}
                  onChange={e => setRequestFood(Math.max(0, +e.target.value))}
                  className="w-full p-1 rounded bg-background border border-border text-xs" />
              </div>
            </div>
          </div>

          <Button size="sm" className="w-full" onClick={sendOffer} disabled={sending || !selectedFriend}>
            <Send className="w-3 h-3 mr-1" /> Enviar Proposta
          </Button>
        </div>

        {/* Trade History */}
        <h3 className="text-sm font-bold mb-2">Propostas</h3>
        {trades.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma proposta ainda.</p>}
        <div className="space-y-2">
          {trades.map(t => (
            <div key={t.id} className={`rounded-lg p-2 text-xs border ${
              t.status === 'pending' ? 'border-primary/30 bg-primary/5' :
              t.status === 'accepted' ? 'border-green-500/30 bg-green-500/5' :
              'border-destructive/30 bg-destructive/5'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold">
                  {t.sender_id === studentId ? `→ ${t.receiver_name}` : `← ${t.sender_name}`}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  t.status === 'pending' ? 'bg-primary/20 text-primary' :
                  t.status === 'accepted' ? 'bg-green-500/20 text-green-500' :
                  'bg-destructive/20 text-destructive'
                }`}>
                  {t.status === 'pending' ? 'Pendente' : t.status === 'accepted' ? 'Aceite' : 'Rejeitada'}
                </span>
              </div>
              <div className="flex gap-3">
                <span>Oferece: {t.offer_coins > 0 && `🪙${t.offer_coins}`} {t.offer_food > 0 && `🍖${t.offer_food}`}</span>
                <span>Pede: {t.request_coins > 0 && `🪙${t.request_coins}`} {t.request_food > 0 && `🍖${t.request_food}`}</span>
              </div>
              {t.status === 'pending' && t.receiver_id === studentId && (
                <div className="flex gap-1 mt-1">
                  <Button size="sm" variant="outline" className="h-6 text-xs flex-1" onClick={() => respondTrade(t.id, true)}>
                    <Check className="w-3 h-3 mr-1" /> Aceitar
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 text-xs flex-1 text-destructive" onClick={() => respondTrade(t.id, false)}>
                    <X className="w-3 h-3 mr-1" /> Rejeitar
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
