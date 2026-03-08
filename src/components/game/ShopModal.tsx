import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Coins, Diamond, Castle, Palette, Zap, Shield } from "lucide-react";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  item_type: string;
  rarity: string;
  price_coins: number;
  price_diamonds: number;
  min_village_level: number;
  defense_bonus: number;
  citizen_bonus: number;
  xp_bonus: number;
}

interface ShopModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  coins: number;
  diamonds: number;
  villageLevel: number;
  onPurchase: () => void;
}

const itemTypeIcons = {
  building: Castle,
  decoration: Palette,
  powerup: Zap,
  defense: Shield,
};

const rarityColors = {
  common: "bg-muted text-muted-foreground",
  rare: "bg-blue-500/20 text-blue-500",
  epic: "bg-purple-500/20 text-purple-500",
  legendary: "bg-amber-500/20 text-amber-500",
};

export const ShopModal = ({
  open,
  onOpenChange,
  studentId,
  coins,
  diamonds,
  villageLevel,
  onPurchase,
}: ShopModalProps) => {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchItems();
    }
  }, [open, studentId]);

  const fetchItems = async () => {
    setLoading(true);
    
    const [itemsRes, inventoryRes] = await Promise.all([
      supabase.from("shop_items").select("*").eq("is_available", true).order("price_coins"),
      supabase.from("player_inventory").select("item_id").eq("student_id", studentId),
    ]);

    if (itemsRes.data) setItems(itemsRes.data as ShopItem[]);
    if (inventoryRes.data) setOwnedItems(inventoryRes.data.map(i => i.item_id));
    
    setLoading(false);
  };

  const purchaseItem = async (item: ShopItem) => {
    if (item.price_coins > coins && item.price_diamonds > diamonds) {
      toast.error("Não tens recursos suficientes!");
      return;
    }
    if (item.min_village_level > villageLevel) {
      toast.error(`Precisas de nível ${item.min_village_level} de aldeia!`);
      return;
    }

    setPurchasing(item.id);

    // Deduct resources
    const updates: any = {};
    if (item.price_coins > 0) updates.coins = coins - item.price_coins;
    if (item.price_diamonds > 0) updates.diamonds = diamonds - item.price_diamonds;

    const { error: updateError } = await supabase
      .from("students")
      .update(updates)
      .eq("id", studentId);

    if (updateError) {
      toast.error("Erro ao comprar item");
      setPurchasing(null);
      return;
    }

    // Add to inventory
    const { error: insertError } = await supabase
      .from("player_inventory")
      .insert({ student_id: studentId, item_id: item.id });

    if (insertError) {
      toast.error("Erro ao adicionar ao inventário");
    } else {
      toast.success(`${item.name} comprado com sucesso! 🎉`);
      setOwnedItems([...ownedItems, item.id]);
      onPurchase();
    }

    setPurchasing(null);
  };

  const filterByType = (type: string) => items.filter(i => i.item_type === type);

  const ItemCard = ({ item }: { item: ShopItem }) => {
    const owned = ownedItems.includes(item.id);
    const canAfford = item.price_coins <= coins || item.price_diamonds <= diamonds;
    const meetsLevel = item.min_village_level <= villageLevel;
    const Icon = itemTypeIcons[item.item_type as keyof typeof itemTypeIcons] || Castle;

    return (
      <div className={`p-4 rounded-xl border ${owned ? "border-green-500 bg-green-500/10" : "border-border bg-card"}`}>
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${rarityColors[item.rarity as keyof typeof rarityColors]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-display font-bold text-sm">{item.name}</h4>
              <Badge variant="outline" className={`text-xs ${rarityColors[item.rarity as keyof typeof rarityColors]}`}>
                {item.rarity}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              {item.defense_bonus > 0 && <span>🛡️ +{item.defense_bonus}</span>}
              {item.citizen_bonus > 0 && <span>👥 +{item.citizen_bonus}</span>}
              {item.xp_bonus > 0 && <span>⭐ +{item.xp_bonus}</span>}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.price_coins > 0 && (
                  <span className="flex items-center gap-1 text-sm">
                    <Coins className="w-4 h-4 text-gold" />
                    {item.price_coins}
                  </span>
                )}
                {item.price_diamonds > 0 && (
                  <span className="flex items-center gap-1 text-sm">
                    <Diamond className="w-4 h-4 text-diamond" />
                    {item.price_diamonds}
                  </span>
                )}
              </div>
              
              {owned ? (
                <Badge className="bg-green-500">✓ Comprado</Badge>
              ) : (
                <Button
                  size="sm"
                  disabled={!canAfford || !meetsLevel || purchasing === item.id}
                  onClick={() => purchaseItem(item)}
                >
                  {purchasing === item.id ? "..." : "Comprar"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            🏪 Loja
            <span className="flex items-center gap-3 ml-auto text-sm font-normal">
              <span className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-gold" /> {coins}
              </span>
              <span className="flex items-center gap-1">
                <Diamond className="w-4 h-4 text-diamond" /> {diamonds}
              </span>
            </span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="building" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="building" className="gap-1">
              <Castle className="w-4 h-4" /> Edifícios
            </TabsTrigger>
            <TabsTrigger value="decoration" className="gap-1">
              <Palette className="w-4 h-4" /> Decorações
            </TabsTrigger>
            <TabsTrigger value="defense" className="gap-1">
              <Shield className="w-4 h-4" /> Defesa
            </TabsTrigger>
            <TabsTrigger value="powerup" className="gap-1">
              <Zap className="w-4 h-4" /> Power-ups
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">A carregar...</div>
            ) : (
              <>
                <TabsContent value="building" className="space-y-3 mt-0">
                  {filterByType("building").map(item => <ItemCard key={item.id} item={item} />)}
                  {filterByType("building").length === 0 && <p className="text-center text-muted-foreground py-4">Sem itens disponíveis</p>}
                </TabsContent>
                <TabsContent value="decoration" className="space-y-3 mt-0">
                  {filterByType("decoration").map(item => <ItemCard key={item.id} item={item} />)}
                  {filterByType("decoration").length === 0 && <p className="text-center text-muted-foreground py-4">Sem itens disponíveis</p>}
                </TabsContent>
                <TabsContent value="defense" className="space-y-3 mt-0">
                  {filterByType("defense").map(item => <ItemCard key={item.id} item={item} />)}
                  {filterByType("defense").length === 0 && <p className="text-center text-muted-foreground py-4">Sem itens disponíveis</p>}
                </TabsContent>
                <TabsContent value="powerup" className="space-y-3 mt-0">
                  {filterByType("powerup").map(item => <ItemCard key={item.id} item={item} />)}
                  {filterByType("powerup").length === 0 && <p className="text-center text-muted-foreground py-4">Sem itens disponíveis</p>}
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};