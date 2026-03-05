import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import EnemyInfo from "@/components/battle/EnemyInfo";
import PlayerInfo from "@/components/battle/PlayerInfo";
import Board from "@/components/battle/Board";
import { PhaserBoard } from "@/components/PhaserBoard";
import { useMatch3 } from "@/hooks/useMatch3";
import bgMystic from "@/assets/images/bg-mystic.png";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sword, Heart, Star, Map as MapIcon, ChevronRight, Trophy, Lock, Zap, Coins, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import bgMysticForest from "@/assets/images/bg-mystic-forest.png";

const ENEMY_NAMES = ["Shadow Stalker", "Void Weaver", "Flame Acolyte", "Frost Golem", "Ancient Treant", "Crystal Wyvern", "Abyssal Knight", "Spirit Wolf"];

const LEVELS_COUNT = 50;

const generateVerticalLevels = (count: number) => {
  const levels = [];
  const startY = 95; // Bottom
  const endY = 5;    // Top
  const stepY = (startY - endY) / (count - 1);

  for (let i = 0; i < count; i++) {
    const y = startY - (i * stepY);
    // Add some curve
    const x = 50 + (Math.sin(i * 0.5) * 15);
    levels.push({
      id: i + 1,
      type: (i + 1) % 5 === 0 ? 'boss' : 'normal',
      x: `${x}%`,
      y: `${y}%`,
    });
  }
  return levels;
};

const LEVELS_CONFIG = generateVerticalLevels(LEVELS_COUNT);

interface SavedState {
  unlockedLevel: number;
  completedLevels: Record<number, number>;
  playerStats: {
    level: number;
    exp: number;
    gold: number;
    score: number;
    hp: number;
    maxHp: number;
    attack: number;
    lives: number;
  };
}

export default function GameContainer() {
  const [view, setView] = useState<'map' | 'battle'>('map');
  const [currentLevel, setCurrentLevel] = useState(1);
  
  // Load state from localStorage
  const [gameState, setGameState] = useState<SavedState>(() => {
    const saved = localStorage.getItem('mystic_game_state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    return {
      unlockedLevel: 1,
      completedLevels: {},
      playerStats: {
        level: 1,
        exp: 0,
        gold: 0,
        score: 0,
        hp: 100,
        maxHp: 100,
        attack: 10,
        lives: 3
      }
    };
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mystic_game_state', JSON.stringify(gameState));
  }, [gameState]);

  const handleWin = (stars: number) => {
    setGameState(prev => {
      let newExp = prev.playerStats.exp + (stars * 20);
      let newLevel = prev.playerStats.level;
      if (newExp >= 100) {
        newLevel += Math.floor(newExp / 100);
        newExp = newExp % 100;
      }

      const nextLevel = currentLevel + 1;
      const newUnlocked = nextLevel > prev.unlockedLevel && nextLevel <= LEVELS_COUNT ? nextLevel : prev.unlockedLevel;

      return {
        ...prev,
        unlockedLevel: newUnlocked,
        completedLevels: { ...prev.completedLevels, [currentLevel]: Math.max(prev.completedLevels[currentLevel] || 0, stars) },
        playerStats: {
          ...prev.playerStats,
          level: newLevel,
          exp: newExp,
          score: prev.playerStats.score + (stars * 500),
          gold: prev.playerStats.gold + (stars * 10)
        }
      };
    });
    setView('map');
  };

  if (view === 'map') {
    return <MysticMap 
      unlockedLevel={gameState.unlockedLevel}
      completedLevels={gameState.completedLevels} 
      playerStats={gameState.playerStats}
      onSelectLevel={(lv) => {
        setCurrentLevel(lv);
        setView('battle');
      }} 
    />;
  }

  return <Battle 
    level={currentLevel} 
    playerStats={gameState.playerStats}
    onWin={handleWin}
    onExit={() => setView('map')}
  />;
}

function MysticMap({ unlockedLevel, completedLevels, playerStats, onSelectLevel }: { 
  unlockedLevel: number; 
  completedLevels: Record<number, number>;
  playerStats: any;
  onSelectLevel: (lv: number) => void;
}) {
  const [fireflies, setFireflies] = useState<{ id: number, x: number, y: number, duration: number, delay: number }[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const isPerfect = Object.values(completedLevels).filter(s => s === 3).length === LEVELS_COUNT;

  useEffect(() => {
    const flies = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 5 + Math.random() * 7,
      delay: Math.random() * 5,
    }));
    setFireflies(flies);

    // Smooth scroll to latest level
    setTimeout(() => {
      const currentLevelElement = document.getElementById(`level-${unlockedLevel}`);
      if (currentLevelElement && mapRef.current) {
        currentLevelElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, [unlockedLevel]);

  return (
    <div className="relative h-screen w-full max-w-[390px] mx-auto overflow-hidden bg-[#051510] font-sans text-white select-none shadow-2xl flex flex-col items-center">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgMysticForest})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a2a20]/40 via-transparent to-[#051510]/90" />
      </div>

      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        {fireflies.map((fly) => (
          <motion.div
            key={fly.id}
            className="absolute w-1.5 h-1.5 bg-yellow-200 rounded-full blur-[1px] shadow-[0_0_12px_#fef08a]"
            initial={{ x: `${fly.x}%`, y: `${fly.y}%`, opacity: 0 }}
            animate={{ 
              y: [`${fly.y}%`, `${fly.y - 20}%`],
              x: [`${fly.x}%`, `${fly.x + (Math.random() * 10 - 5)}%`],
              opacity: [0, 0.9, 0],
              scale: [1, 1.5, 1]
            }}
            transition={{ 
              duration: fly.duration,
              delay: fly.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="absolute top-4 left-4 right-4 z-50">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-2xl">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="text-amber-400 font-display font-bold text-lg">LV {playerStats.level}</div>
              <div className="flex items-center gap-2 ml-2">
                <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-full border border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.2)]">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/50">
                    <Heart size={10} className="fill-red-500 text-red-500" />
                  </div>
                  <span className="text-[10px] font-bold text-red-100">{playerStats.hp}/{playerStats.maxHp}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-full border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/50">
                    <Sword size={10} className="fill-amber-500 text-amber-500" />
                  </div>
                  <span className="text-[10px] font-bold text-amber-100">{playerStats.attack}</span>
                </div>
              </div>
            </div>
            <div className="w-24 h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 mt-1">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(playerStats.hp / playerStats.maxHp) * 100}%` }}
                className="h-full bg-emerald-500 shadow-[0_0_8px_#10b981]"
              />
            </div>
            <div className="text-[8px] font-bold text-emerald-200/70 tracking-tight">{playerStats.hp} / {playerStats.maxHp}</div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold text-teal-200 uppercase tracking-widest opacity-70">EXP</span>
                <span className="text-xs font-bold text-white">{playerStats.exp} / 100</span>
              </div>
          </div>
        </div>
      </div>

      <div ref={mapRef} className="relative w-full h-full overflow-y-auto scrollbar-hide pt-24 pb-32">
        <div className="relative w-full min-h-[3000px] flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d={LEVELS_CONFIG.reduce((acc, curr, i) => {
                const prefix = i === 0 ? 'M' : 'L';
                return `${acc} ${prefix} ${curr.x.replace('%', '')} ${curr.y.replace('%', '')}`;
              }, '')}
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: (unlockedLevel - 1) / (LEVELS_COUNT - 1) }}
              transition={{ duration: 1.5, ease: "linear" }}
              d={LEVELS_CONFIG.reduce((acc, curr, i) => {
                const prefix = i === 0 ? 'M' : 'L';
                return `${acc} ${prefix} ${curr.x.replace('%', '')} ${curr.y.replace('%', '')}`;
              }, '')}
              fill="none"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_8px_#10b981]"
            />
          </svg>

          {LEVELS_CONFIG.map((level) => {
            const isLocked = level.id > unlockedLevel;
            const isCurrent = level.id === unlockedLevel;
            const isBoss = level.type === 'boss';
            const stars = completedLevels[level.id] || 0;

            return (
              <div 
                key={level.id}
                id={`level-${level.id}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: level.x, top: level.y }}
              >
                <motion.div
                  initial={isCurrent ? { scale: 0, opacity: 0, rotate: -180 } : { scale: 1, opacity: 1, rotate: 0 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  whileHover={!isLocked ? { scale: 1.1 } : {}}
                  whileTap={!isLocked ? { scale: 0.95 } : { x: [0, -5, 5, -5, 5, 0], transition: { duration: 0.2 } }}
                  onClick={() => !isLocked && onSelectLevel(level.id)}
                  className="relative cursor-pointer flex flex-col items-center"
                >
                  {isBoss && (
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-6 bg-red-600 text-[8px] font-black px-1.5 py-0.5 rounded-sm shadow-[0_0_12px_rgba(220,38,38,0.9)] z-10"
                    >
                      BOSS
                    </motion.div>
                  )}

                  <div className={`
                    relative rounded-full flex items-center justify-center transition-all duration-500
                    ${isBoss ? 'w-12 h-12 border-2' : 'w-9 h-9 border'}
                    ${isLocked 
                      ? 'bg-black/80 border-white/20 text-white/20' 
                      : 'bg-[#0a2a20] border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]'}
                    ${isCurrent ? 'ring-4 ring-amber-400/40' : ''}
                    ${isPerfect && !isLocked ? 'shadow-[0_0_25px_#fbbf24]' : ''}
                  `}>
                    {isLocked ? (
                      <Lock size={isBoss ? 16 : 12} />
                    ) : (
                      <span className={`font-bold ${isBoss ? 'text-lg' : 'text-sm'} text-white`}>{level.id}</span>
                    )}

                    {isCurrent && (
                      <motion.div 
                        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-emerald-400 rounded-full blur-xl"
                      />
                    )}

                    {isBoss && !isLocked && (
                      <motion.div 
                        animate={{ opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute -inset-2 bg-red-500 rounded-full blur-md -z-10"
                      />
                    )}
                  </div>

                  {!isLocked && (
                    <div className="flex gap-0.5 mt-1.5">
                      {[1, 2, 3].map(i => (
                        <Star 
                          key={i} 
                          size={10} 
                          className={`${i <= stars ? 'fill-amber-400 text-amber-400' : 'text-white/20'}`} 
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

function Battle({ level, playerStats, onWin, onExit }: { level: number; playerStats: any; onWin: (stars: number) => void; onExit: () => void }) {
  const { toast } = useToast();
  
  const [currentLevel, setCurrentLevel] = useState(playerStats.level);
  const [maxHp, setMaxHp] = useState(playerStats.maxHp);
  const [baseDamage, setBaseDamage] = useState(playerStats.attack);
  const [playerHp, setPlayerHp] = useState(playerStats.hp);
  const [exp, setExp] = useState(playerStats.exp);
  const [maxExp, setMaxExp] = useState(100 + (playerStats.level - 1) * 25);
  
  const [enemyName] = useState(ENEMY_NAMES[Math.floor(Math.random() * ENEMY_NAMES.length)]);
  const isBoss = level % 5 === 0;
  const enemyMaxHp = Math.floor(100 * Math.pow(1.15, level)) * (isBoss ? 2.5 : 1);
  const [enemyHp, setEnemyHp] = useState(enemyMaxHp);
  const [enemyAtk] = useState(Math.floor(5 * Math.pow(1.1, level)));
  
  const [shield, setShield] = useState(0);
  const [skillCharge, setSkillCharge] = useState(0);
  const [healCharge, setHealCharge] = useState(0);
  const [critDamage, setCritDamage] = useState(false);
  
  const [isHealGlow, setIsHealGlow] = useState(false);
  const [isDamageGlow, setIsDamageGlow] = useState(false);
  const [isExpGlow, setIsExpGlow] = useState(false);
  const [isShieldGlow, setIsShieldGlow] = useState(false);
  
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; text: string; color: string; x: number; y: number }[]>([]);
  const [levelUpOptions, setLevelUpOptions] = useState<null | { type: 'hp' | 'atk' }[]>(null);

  const spawnFloatingText = (text: string, color: string, isPlayer: boolean = true) => {
    const id = Math.random();
    const newText = { id, text, color, x: isPlayer ? 20 : 70, y: isPlayer ? 80 : 20 };
    setFloatingTexts(prev => [...prev, newText]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(t => t.id !== id)), 800);
  };

  const spawnParticles = (count: number) => {
    const newParticles = [...Array(count)].map(() => ({
      id: Math.random(),
      x: 30 + Math.random() * 40,
      y: 40 + Math.random() * 20
    }));
    setParticles(prev => [...prev, ...newParticles].slice(-50));
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1000);
  };

  const handleLevelUp = (type: 'hp' | 'atk') => {
    if (type === 'hp') {
      setMaxHp((prev: number) => prev + 15);
      setPlayerHp((prev: number) => Math.min(maxHp + 15, prev + 15));
    } else {
      setBaseDamage((prev: number) => prev + 5);
    }
    setExp((prev: number) => prev - maxExp);
    setCurrentLevel((prev: number) => prev + 1);
    setMaxExp((prev: number) => prev + 25);
    setLevelUpOptions(null);
  };

  const handleMatchWithType = (count: number, currentCombo: number, type: string) => {
    if (levelUpOptions) return;

    const gainedExp = count * 2;
    setExp((prev: number) => {
      const newExp = prev + gainedExp;
      if (newExp >= maxExp) {
        setLevelUpOptions([{ type: 'hp' }, { type: 'atk' }]);
      }
      return newExp;
    });
    setIsExpGlow(true);
    setTimeout(() => setIsExpGlow(false), 400);

    if (type === "purple") {
      const amount = count * 5;
      setShield(prev => prev + amount);
      spawnFloatingText(`+${amount} Shield`, "text-purple-400");
      setIsShieldGlow(true);
      const shieldBar = document.querySelector(".shield-impact-target");
      if (shieldBar) {
        shieldBar.classList.add("shield-impact");
        setTimeout(() => shieldBar.classList.remove("shield-impact"), 250);
      }
      setTimeout(() => setIsShieldGlow(false), 500);
    } else if (type === "green") {
      const amount = count * 3;
      setPlayerHp((prev: number) => Math.min(maxHp, prev + amount));
      spawnFloatingText(`+${amount} HP`, "text-green-400");
      setIsHealGlow(true);
      const hpBar = document.querySelector(".hp-impact-target");
      if (hpBar) {
        hpBar.classList.add("hp-impact");
        setTimeout(() => hpBar.classList.remove("hp-impact"), 250);
      }
      setTimeout(() => setIsHealGlow(false), 300);
    } else if (type === "red") {
      setCritDamage(true);
      setTimeout(() => setCritDamage(false), 1000);
    } else if (type === "blue") {
      setSkillCharge(prev => Math.min(100, prev + (count * 10)));
    } else if (type === "yellow") {
      setHealCharge(prev => Math.min(100, prev + (count * 10)));
    }

    const baseDmg = count * (baseDamage / 2);
    const comboMultiplier = 1 + (currentCombo - 1) * 0.5;
    const totalDamage = Math.floor(baseDmg * comboMultiplier);
    setEnemyHp(prev => Math.max(0, prev - totalDamage));
    if (currentCombo > 1) spawnParticles(5);
  };

  const { board, selected, handleSelect, combo, isProcessing } = useMatch3(handleMatchWithType);

  useEffect(() => {
    if (!isProcessing && combo === 0 && enemyHp > 0 && !levelUpOptions) {
      const timer = setTimeout(() => {
        const dmg = Math.floor(enemyAtk * (0.8 + Math.random() * 0.4));
        setPlayerHp((prev: number) => {
          let remainingDmg = dmg;
          if (shield > 0) {
            const absorbed = Math.min(shield, remainingDmg);
            setShield(prevShield => prevShield - absorbed);
            remainingDmg -= absorbed;
          }
          if (remainingDmg > 0) {
            setIsDamageGlow(true);
            setTimeout(() => setIsDamageGlow(false), 200);
          }
          return Math.max(0, prev - remainingDmg);
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isProcessing, combo, enemyHp, enemyAtk, shield, levelUpOptions]);

  useEffect(() => {
    if (enemyHp <= 0) {
      const stars = playerHp / maxHp > 0.8 ? 3 : playerHp / maxHp > 0.4 ? 2 : 1;
      setTimeout(() => onWin(stars), 1500);
    }
    if (playerHp <= 0) {
      toast({ title: "Defeated!", description: "Try again to grow stronger.", variant: "destructive" });
      setTimeout(onExit, 1500);
    }
  }, [enemyHp, playerHp]);

  return (
    <div 
      className="w-full h-[100dvh] relative bg-cover bg-center overflow-hidden flex justify-start sm:max-w-md mx-auto shadow-2xl battle-root"
      style={{ backgroundImage: `url(${bgMystic})` }}
    >
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ x: `${p.x}%`, y: `${p.y}%`, opacity: 1, scale: 1 }}
            animate={{ x: "85%", y: "50%", opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute w-2 h-2 rounded-full bg-yellow-400 blur-[2px] z-50 shadow-[0_0_10px_#fbbf24]"
          />
        ))}
        {floatingTexts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 1, y: `${t.y}%`, x: `${t.x}%` }}
            animate={{ opacity: 0, y: `${t.y - 10}%` }}
            className={cn("absolute z-50 font-black text-xl drop-shadow-lg pointer-events-none", t.color)}
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="battle-fog-layer pointer-events-none" />
      <div className="battle-particles-layer pointer-events-none">
        {[...Array(16)].map((_, i) => (
          <motion.div
            key={i}
            className="battle-sparkle"
            initial={{ opacity: 0, scale: 0.6, y: 0 }}
            animate={{ opacity: [0, 0.9, 0], scale: [0.6, 1, 0.8], y: [-10, 10, -10] }}
            transition={{ duration: 6 + i, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
            style={{ left: `${10 + (i * 5) % 80}%`, top: `${20 + (i * 7) % 60}%` }}
          />
        ))}
      </div>

      <div
        id="attack-area"
        className="w-full max-w-[420px] sm:w-[68%] h-full flex flex-col justify-between py-6 px-4 z-10 backdrop-blur-[3px] bg-black/45 relative mx-auto battle-panel"
      >
        <div className="w-full flex flex-col gap-1 relative">
          <EnemyInfo name={enemyName} level={level} hp={enemyHp} maxHp={enemyMaxHp} />
          {critDamage && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              className="absolute -right-4 top-1/2 -translate-y-1/2 text-red-600 font-black text-2xl drop-shadow-[0_0_10px_rgba(220,38,38,0.8)] z-50"
            >
              CRIT DAMAGE
            </motion.div>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center justify-start w-full relative mt-3">
          <AnimatePresence>
            {combo > 1 && (
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="absolute top-0 flex flex-col items-center z-20 pointer-events-none"
              >
                <span className="text-4xl font-display font-black gold-text drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
                  Combo {combo}
                </span>
                <span className="text-sm font-bold text-yellow-300">+{((combo - 1) * 50)}% DAMAGE</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="w-full flex flex-col gap-4">
            <Board
              board={board}
              selected={selected}
              onSelect={handleSelect}
              isProcessing={isProcessing || !!levelUpOptions}
            />
            {/* Optional: keep Phaser mirror beneath if desired */}
            {/* <PhaserBoard board={board} /> */}
            <PlayerInfo 
              level={currentLevel} hp={playerHp} maxHp={maxHp} exp={exp} maxExp={maxExp}
              shield={shield} skillCharge={skillCharge} healCharge={healCharge}
              isHealGlow={isHealGlow} isDamageGlow={isDamageGlow} isExpGlow={isExpGlow} isShieldGlow={isShieldGlow}
              onHeal={() => { 
                if (healCharge >= 100) {
                  const amount = 40;
                  setPlayerHp((prev: number) => Math.min(maxHp, prev + amount)); 
                  setHealCharge(0); 
                  spawnFloatingText(`+${amount} HP`, "text-green-400");
                  setIsHealGlow(true);
                  setTimeout(() => setIsHealGlow(false), 300);
                }
              }}
              onBash={() => { 
                if (skillCharge >= 100) {
                  setEnemyHp(prev => Math.max(0, prev - (baseDamage * 4))); 
                  setSkillCharge(0); 
                  spawnParticles(10);
                }
              }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {levelUpOptions && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[100] bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center p-6"
            onContextMenu={(e) => e.preventDefault()}
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-xs bg-[#1a1a1a] rounded-3xl border-4 border-yellow-600/50 p-6 shadow-[0_0_50px_rgba(202,138,4,0.3)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-yellow-600/10 to-transparent pointer-events-none" />
              <motion.h2 
                animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-4xl font-display font-black gold-text text-center mb-8 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]"
              >
                LEVEL UP
              </motion.h2>
              <div className="flex flex-col gap-5 w-full">
                <UpgradeCard 
                  title="VITALITY" value="+15 Max HP" subtext="Increase survivability"
                  icon={<Heart size={24} className="text-emerald-400" />} color="emerald"
                  onClick={() => handleLevelUp('hp')}
                />
                <UpgradeCard 
                  title="STRENGTH" value="+5 Base Damage" subtext="Increase attack power"
                  icon={<Sword size={24} className="text-red-400" />} color="red"
                  onClick={() => handleLevelUp('atk')}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UpgradeCard({ title, value, subtext, icon, color, onClick }: any) {
  const [clicked, setClicked] = useState(false);
  const handleClick = () => {
    if (clicked) return;
    setClicked(true);
    onClick();
  };
  return (
    <motion.button 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      className={cn(
        "w-full group relative overflow-hidden rounded-2xl border-2 p-5 transition-all duration-300",
        color === 'emerald' 
          ? "border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          : "border-red-500/40 bg-red-950/20 hover:border-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
      )}
    >
      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity", color === 'emerald' ? "bg-emerald-500" : "bg-red-500")} />
      <div className="relative flex items-center gap-4 text-left">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300", 
          color === 'emerald' ? "bg-emerald-500/20 border-emerald-500/50 group-hover:bg-emerald-500/30" : "bg-red-500/20 border-red-500/50 group-hover:bg-red-500/30")}>
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black text-white tracking-widest uppercase opacity-60">{title}</span>
          <span className={cn("text-xl font-black transition-all", color === 'emerald' ? "text-emerald-400" : "text-red-400")}>{value}</span>
          <span className="text-[10px] font-bold text-white/50">{subtext}</span>
        </div>
      </div>
    </motion.button>
  );
}
