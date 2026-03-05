import { cn } from "@/lib/utils";
import { Heart, Sword } from "lucide-react";

interface PlayerInfoProps {
  level: number;
  hp: number;
  maxHp: number;
  exp: number;
  maxExp: number;
  shield: number;
  skillCharge: number;
  healCharge: number;
  onHeal: () => void;
  onBash: () => void;
  isHealGlow: boolean;
  isDamageGlow: boolean;
  isExpGlow: boolean;
  isShieldGlow: boolean;
}

export default function PlayerInfo({ 
  level, hp, maxHp, exp, maxExp, shield, skillCharge, healCharge, onHeal, onBash,
  isHealGlow, isDamageGlow, isExpGlow, isShieldGlow
}: PlayerInfoProps) {
  const hpPercentage = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const shieldPercentage = Math.max(0, Math.min(100, (shield / 50) * 100)); // Assuming 50 is max shield for display
  const expPercentage = Math.max(0, Math.min(100, (exp / maxExp) * 100));
  
  return (
    <div className="w-full z-10">
      <div className="player-panel fantasy-border">
        <div className="player-panel-header">
          <span className="player-label">Player Lv.</span>
          <span className="player-level-value">{level}</span>
        </div>

        {/* Shield Bar */}
        <div id="shield-bar" className="rpg-bar shield-bar shield-impact-target">
          <div 
            className={cn(
              "rpg-bar-fill shield-fill",
              isShieldGlow && "animate-shimmer"
            )}
            style={{ width: `${shieldPercentage}%` }}
          >
            <div className="rpg-bar-sheen" />
          </div>
          <span className="rpg-bar-text">
            SHIELD {Math.ceil(shield)} / 50
          </span>
        </div>

        {/* HP Bar */}
        <div className="rpg-bar hp-bar hp-impact-target">
          <div className="rpg-bar-inner">
            <div 
              className={cn(
                "rpg-bar-fill hp-fill",
                isHealGlow && "flash-green",
                isDamageGlow && "flash-red"
              )}
              style={{ width: `${hpPercentage}%` }}
            >
              <div className="rpg-bar-sheen" />
            </div>
          </div>
          <span className="rpg-bar-text">
            {Math.ceil(hp)} / {maxHp}
          </span>
        </div>

        {/* EXP Bar */}
        <div className="rpg-bar exp-bar">
          <div 
            className={cn(
              "rpg-bar-fill exp-fill",
              isExpGlow && "animate-pulse-glow"
            )}
            style={{ width: `${expPercentage}%` }}
          >
            <div className="rpg-bar-sheen" />
          </div>
          <span className="rpg-bar-text">
            EXP {exp} / {maxExp}
          </span>
        </div>

        {/* Skills */}
        <div className="flex gap-3 mt-3">
          <SkillButton 
            id="heal-bar"
            name="HEAL" 
            icon={<Heart size={18} className="text-yellow-200 fill-yellow-200" />} 
            color="from-yellow-900 via-yellow-600 to-amber-300" 
            glowColor="shadow-[0_0_28px_rgba(234,179,8,0.6)] border-yellow-400/60"
            charge={healCharge}
            onClick={onHeal}
          />
          <SkillButton 
            id="skill-bar"
            name="SKILL" 
            icon={<Sword size={18} className="text-sky-200 fill-sky-200" />} 
            color="from-indigo-900 via-sky-600 to-sky-300" 
            glowColor="shadow-[0_0_28px_rgba(59,130,246,0.6)] border-sky-400/60"
            charge={skillCharge}
            onClick={onBash}
          />
        </div>
      </div>
    </div>
  );
}

interface SkillButtonProps {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
  charge: number;
  onClick: () => void;
}

function SkillButton({ id, name, icon, color, glowColor, charge, onClick }: SkillButtonProps) {
  const isReady = charge >= 100;
  
  return (
    <button 
      id={id}
      onClick={() => isReady && onClick()}
      disabled={!isReady}
      className={cn(
        "rpg-skill-button relative flex-1 rounded-xl border-2 overflow-hidden py-2.5 px-3 flex flex-col items-center justify-center transition-all duration-200",
        isReady 
          ? cn("rpg-skill-ready cursor-pointer", glowColor) 
          : "rpg-skill-disabled border-gray-700 bg-gray-900/80"
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-b opacity-10", color)} />
      
      {/* Charge Fill at bottom */}
      <div 
        className={cn("absolute left-0 bottom-0 h-1.5 transition-all duration-300 bg-gradient-to-r", color)}
        style={{ width: `${charge}%` }}
      />
      
      <div className="flex items-center gap-2 z-10 w-full justify-center">
        {icon}
        <span className="text-white font-display font-black text-xs tracking-tighter uppercase">{name}</span>
      </div>
      <div className="text-white font-black text-[10px] z-10 mt-0.5 opacity-90">
        {charge}%
      </div>
    </button>
  );
}
