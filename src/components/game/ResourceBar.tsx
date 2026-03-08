import { RESOURCE_INFO, NaturalResource } from '@/hooks/useResources';
import { Pickaxe } from 'lucide-react';

interface ResourceAmounts {
  wood: number;
  stone: number;
  iron: number;
  coal: number;
  food: number;
  leather: number;
  fish: number;
}

interface ResourceBarProps {
  resources: ResourceAmounts;
}

const DISPLAY_ORDER: NaturalResource[] = ['wood', 'stone', 'iron', 'coal', 'food', 'leather', 'fish'];

export const ResourceBar = ({ resources }: ResourceBarProps) => {
  const nonZero = DISPLAY_ORDER.filter(r => resources[r] > 0);
  const toShow = nonZero.length > 0 ? nonZero : DISPLAY_ORDER.slice(0, 4);

  return (
    <div className="flex gap-1 flex-wrap">
      {toShow.map(key => {
        const info = RESOURCE_INFO[key];
        return (
          <div
            key={key}
            className="bg-card/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1 text-xs font-body border border-border"
            title={info.label}
          >
            <span className="text-sm">{info.emoji}</span>
            <span className="font-bold">{resources[key]}</span>
          </div>
        );
      })}
    </div>
  );
};
