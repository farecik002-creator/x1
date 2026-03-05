import { GemType } from "@/hooks/useMatch3";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface BoardProps {
  board: { id: string; type: GemType }[][];
  selected: { r: number; c: number } | null;
  onSelect: (r: number, c: number) => void;
  isProcessing: boolean;
}

export default function Board({
  board,
  selected,
  onSelect,
  isProcessing,
}: BoardProps) {
  const prevBoard = useRef<{ id: string; type: GemType }[][]>([]);

  const gemImageMap: Record<string, string> = {
    blue: "/gems/blue.png",
    red: "/gems/red.png",
    green: "/gems/green.png",
    purple: "/gems/purp.png",
    yellow: "/gems/yell.png",
    cyan: "/gems/cya.png",
  };

  /* FLYING LIGHT ENERGY EFFECT */
  const spawnFlyingEnergy = (r: number, c: number, type: GemType) => {
    const tile = document.querySelector(`[data-pos="${r},${c}"]`) as HTMLElement;
    if (!tile) return;

    const rect = tile.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    if (type === "cyan") {
      const explosion = document.createElement("div");
      explosion.className = "cyan-burst-effect";
      explosion.style.left = `${startX}px`;
      explosion.style.top = `${startY}px`;
      document.body.appendChild(explosion);
      setTimeout(() => explosion.remove(), 600);
      return;
    }

    const targetMap: Record<string, string> = {
      green: "#hp-bar",
      blue: "#skill-bar",
      red: "#attack-area",
      purple: "#shield-bar",
      yellow: "#heal-bar",
    };

    const targetSelector = targetMap[type];
    const targetEl = targetSelector ? document.querySelector(targetSelector) : null;
    if (!targetEl) return;

    const targetRect = targetEl.getBoundingClientRect();
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;

    const particle = document.createElement("div");
    particle.className = cn("flying-energy-particle", type);
    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;
    document.body.appendChild(particle);

    const animation = particle.animate([
      { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
      { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0.5)`, opacity: 0 }
    ], {
      duration: 800,
      easing: "cubic-bezier(0.2, 0.8, 0.2, 1)"
    });

    animation.onfinish = () => particle.remove();
  };

  useEffect(() => {
    if (prevBoard.current.length > 0) {
      board.forEach((row, r) => {
        row.forEach((gem, c) => {
          const prevGem = prevBoard.current[r]?.[c];
          if (prevGem && prevGem.type !== "empty" && gem.type === "empty") {
            spawnFlyingEnergy(r, c, prevGem.type);
          }
        });
      });
    }
    prevBoard.current = board.map(row => row.map(gem => ({ ...gem })));
  }, [board]);

  return (
    <div className="relative w-full aspect-square board-frame z-10 board">
      <div className="absolute inset-0 board-frame-glow pointer-events-none" />
      <div className="relative w-full h-full p-2 fantasy-border flex items-center justify-center">
        <div
          className="w-full h-full grid gap-1 board-grid"
          style={{
            gridTemplateColumns: `repeat(${board[0]?.length || 8}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${board.length}, minmax(0, 1fr))`,
          }}
        >
          {board.map((row, r) =>
            row.map((gem, c) => {
              const isSelected = selected?.r === r && selected?.c === c;
              const isEmpty = gem.type === "empty";
              const gemImage = gemImageMap[gem.type];

              return (
                <div
                  key={gem.id}
                  data-pos={`${r},${c}`}
                  data-testid={`gem-${r}-${c}`}
                  onClick={() => {
                    if (!isEmpty) {
                      onSelect(r, c);
                    }
                  }}
                  className={cn(
                    "relative w-full h-full flex items-center justify-center transition-all duration-300 tile gem-tile",
                    isSelected && "gem-selected",
                    !isEmpty && !isProcessing && "cursor-pointer",
                    isEmpty ? "opacity-0 scale-50" : "opacity-100 scale-100"
                  )}
                >
                  {!isEmpty && gemImage && (
                    <img
                      src={gemImage}
                      alt={gem.type}
                      className={cn(
                        "w-full h-full object-contain transition-all duration-300 gem-sprite",
                        isSelected && "gem-sprite-selected"
                      )}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
        <div className="pointer-events-none absolute inset-0 board-magic-particles" />
      </div>
    </div>
  );
}
