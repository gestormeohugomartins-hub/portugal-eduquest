import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TerrainElement, TerrainElementType } from '@/lib/terrainGeneration';
import { toast } from 'sonner';
import { SFX } from '@/lib/sounds';

export type NaturalResource = 'wood' | 'stone' | 'iron' | 'coal' | 'food' | 'leather' | 'fish';

interface ResourceAmounts {
  wood: number;
  stone: number;
  iron: number;
  coal: number;
  food: number;
  leather: number;
  fish: number;
}

// Map terrain element types to resources
const TERRAIN_TO_RESOURCE: Partial<Record<TerrainElementType, { resource: NaturalResource; amount: [number, number]; cooldownMs: number; label: string; emoji: string }>> = {
  pine: { resource: 'wood', amount: [2, 5], cooldownMs: 30000, label: 'Madeira', emoji: '🪵' },
  oak: { resource: 'wood', amount: [3, 7], cooldownMs: 45000, label: 'Madeira', emoji: '🪵' },
  rock_small: { resource: 'stone', amount: [1, 3], cooldownMs: 30000, label: 'Pedra', emoji: '🪨' },
  rock_large: { resource: 'stone', amount: [3, 6], cooldownMs: 60000, label: 'Pedra', emoji: '🪨' },
  iron_ore: { resource: 'iron', amount: [1, 3], cooldownMs: 120000, label: 'Ferro', emoji: '⛏️' },
  coal_ore: { resource: 'coal', amount: [2, 4], cooldownMs: 90000, label: 'Carvão', emoji: '⬛' },
  sheep: { resource: 'food', amount: [3, 6], cooldownMs: 60000, label: 'Alimento', emoji: '🍖' },
  rabbit: { resource: 'food', amount: [1, 3], cooldownMs: 30000, label: 'Alimento', emoji: '🍖' },
  deer: { resource: 'leather', amount: [2, 4], cooldownMs: 90000, label: 'Pele', emoji: '🦌' },
  fish_spot: { resource: 'fish', amount: [2, 5], cooldownMs: 45000, label: 'Peixe', emoji: '🐟' },
};

export const RESOURCE_INFO: Record<NaturalResource, { emoji: string; label: string; color: string }> = {
  wood: { emoji: '🪵', label: 'Madeira', color: '#8B4513' },
  stone: { emoji: '🪨', label: 'Pedra', color: '#808080' },
  iron: { emoji: '⛏️', label: 'Ferro', color: '#B87333' },
  coal: { emoji: '⬛', label: 'Carvão', color: '#2a2a2a' },
  food: { emoji: '🍖', label: 'Alimento', color: '#CD853F' },
  leather: { emoji: '🦌', label: 'Pele', color: '#8B6914' },
  fish: { emoji: '🐟', label: 'Peixe', color: '#4682B4' },
};

const DEFAULT_RESOURCES: ResourceAmounts = { wood: 0, stone: 0, iron: 0, coal: 0, food: 0, leather: 0, fish: 0 };

export function useResources(studentId: string | undefined) {
  const [resources, setResources] = useState<ResourceAmounts>({ ...DEFAULT_RESOURCES });
  const [cooldowns, setCooldowns] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(true);

  // Load resources from DB
  useEffect(() => {
    if (!studentId) return;
    const load = async () => {
      const { data } = await (supabase
        .from('player_resources' as any)
        .select('resource_type, amount')
        .eq('student_id', studentId)) as any;

      if (data) {
        const r = { ...DEFAULT_RESOURCES };
        for (const row of data) {
          const key = row.resource_type as NaturalResource;
          if (key in r) r[key] = row.amount;
        }
        setResources(r);
      }

      // Load recent gathering cooldowns
      const fiveMinAgo = new Date(Date.now() - 120000).toISOString();
      const { data: logs } = await (supabase
        .from('gathering_log' as any)
        .select('terrain_element_id, gathered_at')
        .eq('student_id', studentId)
        .gte('gathered_at', fiveMinAgo)) as any;

      if (logs) {
        const cd = new Map<number, number>();
        for (const log of logs) {
          cd.set(log.terrain_element_id, new Date(log.gathered_at).getTime());
        }
        setCooldowns(cd);
      }

      setLoading(false);
    };
    load();
  }, [studentId]);

  // Check if element is on cooldown
  const isOnCooldown = useCallback((element: TerrainElement): boolean => {
    const info = TERRAIN_TO_RESOURCE[element.type];
    if (!info) return true; // non-gatherable
    const lastGathered = cooldowns.get(element.id);
    if (!lastGathered) return false;
    return Date.now() - lastGathered < info.cooldownMs;
  }, [cooldowns]);

  // Gather resource from terrain element
  const gather = useCallback(async (element: TerrainElement): Promise<boolean> => {
    if (!studentId) return false;
    const info = TERRAIN_TO_RESOURCE[element.type];
    if (!info) {
      toast.error('Este elemento não pode ser recolhido.');
      return false;
    }

    if (isOnCooldown(element)) {
      const lastGathered = cooldowns.get(element.id) || 0;
      const remaining = Math.ceil((info.cooldownMs - (Date.now() - lastGathered)) / 1000);
      toast.info(`${info.emoji} Aguarda ${remaining}s para recolher novamente.`);
      return false;
    }

    // Calculate random amount
    const amount = info.amount[0] + Math.floor(Math.random() * (info.amount[1] - info.amount[0] + 1));

    // Upsert resource
    const currentAmount = resources[info.resource];
    const { error } = await (supabase
      .from('player_resources' as any)
      .upsert(
        { student_id: studentId, resource_type: info.resource, amount: currentAmount + amount, updated_at: new Date().toISOString() },
        { onConflict: 'student_id,resource_type' }
      ) as any);

    if (error) {
      toast.error('Erro ao recolher recurso.');
      return false;
    }

    // Log gathering
    await (supabase.from('gathering_log' as any).insert({
      student_id: studentId,
      resource_type: info.resource,
      amount,
      terrain_element_id: element.id,
    }) as any);

    // Update local state
    setResources(prev => ({ ...prev, [info.resource]: prev[info.resource] + amount }));
    setCooldowns(prev => {
      const next = new Map(prev);
      next.set(element.id, Date.now());
      return next;
    });

    toast.success(`${info.emoji} +${amount} ${info.label}!`);
    SFX.coins();
    return true;
  }, [studentId, resources, cooldowns, isOnCooldown]);

  // Check if a terrain element is gatherable
  const isGatherable = useCallback((type: TerrainElementType): boolean => {
    return type in TERRAIN_TO_RESOURCE;
  }, []);

  return { resources, loading, gather, isOnCooldown, isGatherable };
}
