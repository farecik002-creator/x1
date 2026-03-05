import { cn } from "@/lib/utils";

interface EnemyInfoProps {
  name?: string;
  level: number;
  hp: number;
  maxHp: number;
}

export default function EnemyInfo({ name = "VOID WEAVER", level, hp, maxHp }: EnemyInfoProps) {
  const hpPercentage = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  return (
    <div id="hp-bar" className="w-full flex flex-col gap-3 z-10 enemy-panel">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="text-2xl text-white font-display flex items-center drop-shadow-[0_0_12px_rgba(0,0,0,0.9)] tracking-[0.18em] uppercase enemy-name">
            {name}
          </div>
          <div className="text-xs font-bold text-red-300/90 drop-shadow-sm font-mono tracking-wider mt-0.5">
            HP: {Math.ceil(hp)}/{maxHp}
          </div>
        </div>
        <div className="enemy-level-badge">
          <span className="enemy-level-label">Lv.</span>
          <span className="enemy-level-value">{level}</span>
        </div>
      </div>
      
      <div className="enemy-hp-frame hp-impact-target">
        <div className="enemy-hp-inner">
          <div 
            className="enemy-hp-fill"
            style={{ width: `${hpPercentage}%` }}
          >
            <div className="enemy-hp-sheen" />
          </div>
        </div>
        <span className="enemy-hp-text">
          {Math.ceil(hp)} / {maxHp}
        </span>
      </div>
    </div>
  );
}
