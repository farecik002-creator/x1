import { useState, useCallback, useEffect } from 'react';

export const GEM_TYPES = ['red', 'blue', 'green', 'yellow', 'purple', 'cyan'];
export const BOARD_SIZE = 8;

export type GemType = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'cyan' | 'empty';
export type SpecialType = 'none' | 'row' | 'col' | 'bomb' | 'color';

export interface Gem {
  id: string;
  type: GemType;
  special: SpecialType;
}

export type BoardState = Gem[][];

const generateId = () => Math.random().toString(36).substr(2, 9);

const getRandomGem = (): Gem => ({
  id: generateId(),
  type: GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)] as GemType,
  special: 'none',
});

// Helper to check if a board has any matches (to prevent spawning a board with matches)
const hasInitialMatches = (board: BoardState, currentRow: Gem[], r: number, c: number, type: string) => {
  if (c >= 2 && currentRow[c - 1]?.type === type && currentRow[c - 2]?.type === type) return true;
  if (r >= 2 && board[r - 1][c]?.type === type && board[r - 2][c]?.type === type) return true;
  return false;
};

const createInitialBoard = (): BoardState => {
  const board: BoardState = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row: Gem[] = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      let gem = getRandomGem();
      while (hasInitialMatches(board, row, r, c, gem.type)) {
        gem = getRandomGem();
      }
      row.push(gem);
    }
    board.push(row);
  }
  return board;
};

export const useMatch3 = (onMatch: (count: number, combo: number, type: GemType) => void) => {
  const [board, setBoard] = useState<BoardState>(createInitialBoard());
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [combo, setCombo] = useState(0);

  const checkMatches = useCallback((currentBoard: BoardState) => {
    let hasMatches = false;
    const toRemove = new Set<string>();
    let matchCount = 0;
    let matchType: GemType = 'empty';

    // Horizontal check
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE - 2; c++) {
        const type = currentBoard[r][c].type;
        if (type === 'empty') continue;
        let matchLength = 1;
        while (c + matchLength < BOARD_SIZE && currentBoard[r][c + matchLength].type === type) {
          matchLength++;
        }
        if (matchLength >= 3) {
          for (let i = 0; i < matchLength; i++) {
            toRemove.add(`${r},${c + i}`);
          }
          hasMatches = true;
          matchCount += matchLength;
          matchType = type;
          c += matchLength - 1;
        }
      }
    }

    // Vertical check
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (let r = 0; r < BOARD_SIZE - 2; r++) {
        const type = currentBoard[r][c].type;
        if (type === 'empty') continue;
        let matchLength = 1;
        while (r + matchLength < BOARD_SIZE && currentBoard[r + matchLength][c].type === type) {
          matchLength++;
        }
        if (matchLength >= 3) {
          for (let i = 0; i < matchLength; i++) {
            toRemove.add(`${r + i},${c}`);
          }
          hasMatches = true;
          matchCount += matchLength;
          matchType = type;
          r += matchLength - 1;
        }
      }
    }

    return { hasMatches, toRemove, matchCount, matchType };
  }, []);

  const processMatches = useCallback(async (startBoard: BoardState, currentCombo: number) => {
    let current = [...startBoard.map(row => [...row])];
    const { hasMatches, toRemove, matchCount, matchType } = checkMatches(current);

    if (!hasMatches) {
      setIsProcessing(false);
      setTimeout(() => setCombo(0), 1500); // fade out combo
      return;
    }

    onMatch(matchCount, currentCombo + 1, matchType);
    setCombo(currentCombo + 1);
    updateComboGlow(currentCombo + 1);

    // Remove gems
    toRemove.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      current[r][c] = { ...current[r][c], type: 'empty' };
      const tile = document.querySelector(`[data-pos="${r},${c}"]`) as HTMLElement;
      if (tile) {
        tile.classList.add("energy-impact");
        tile.classList.add("energy-active");
        tile.classList.add(`energy-${matchType}`);
        setTimeout(() => {
          tile.classList.remove("energy-impact", "energy-active", `energy-${matchType}`);
        }, 600);
      }
    });
    premiumBoardImpact();
    setBoard([...current]);

    // Wait for clear animation
    await new Promise(res => setTimeout(res, 400));

    // Drop gems
    for (let c = 0; c < BOARD_SIZE; c++) {
      let emptyCount = 0;
      for (let r = BOARD_SIZE - 1; r >= 0; r--) {
        if (current[r][c].type === 'empty') {
          emptyCount++;
        } else if (emptyCount > 0) {
          current[r + emptyCount][c] = current[r][c];
          // Apply fall animation to falling tile
          const fallingTile = document.querySelector(`[data-pos="${r + emptyCount},${c}"]`) as HTMLElement;
          if (fallingTile) {
            fallingTile.classList.add("premium-fall");
            setTimeout(() => fallingTile.classList.remove("premium-fall"), 340);
          }
          current[r][c] = { id: generateId(), type: 'empty', special: 'none' };
        }
      }
      // Fill new
      for (let r = 0; r < emptyCount; r++) {
        current[r][c] = getRandomGem();
        // New tiles also get fall animation
        setTimeout(() => {
          const newTile = document.querySelector(`[data-pos="${r},${c}"]`) as HTMLElement;
          if (newTile) {
            newTile.classList.add("premium-fall");
            setTimeout(() => newTile.classList.remove("premium-fall"), 340);
          }
        }, 50);
      }
    }
    
    setBoard([...current.map(row => [...row])]);

    // Wait for drop animation
    await new Promise(res => setTimeout(res, 300));

    // Recurse for cascade
    processMatches(current, currentCombo + 1);
  }, [checkMatches, onMatch]);

  const handleSwap = async (r1: number, c1: number, r2: number, c2: number) => {
    if (isProcessing) return;
    
    // Check adjacency
    const isAdjacent = Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
    if (!isAdjacent) {
      setSelected({ r: r2, c: c2 });
      return;
    }

    setIsProcessing(true);
    setSelected(null);

    // Swap
    const newBoard = board.map(row => [...row]);
    const temp = newBoard[r1][c1];
    newBoard[r1][c1] = newBoard[r2][c2];
    newBoard[r2][c2] = temp;
    
    setBoard(newBoard);

    // Check if swap made a match
    const { hasMatches } = checkMatches(newBoard);
    
    if (!hasMatches) {
      // Revert swap
      await new Promise(res => setTimeout(res, 300));
      const revertedBoard = newBoard.map(row => [...row]);
      const tempRev = revertedBoard[r1][c1];
      revertedBoard[r1][c1] = revertedBoard[r2][c2];
      revertedBoard[r2][c2] = tempRev;
      setBoard(revertedBoard);
      setIsProcessing(false);
    } else {
      await new Promise(res => setTimeout(res, 300));
      processMatches(newBoard, 0);
    }
  };

  const handleSelect = (r: number, c: number) => {
    if (isProcessing) return;
    if (!selected) {
      setSelected({ r, c });
    } else if (selected.r === r && selected.c === c) {
      setSelected(null);
    } else {
      handleSwap(selected.r, selected.c, r, c);
    }
  };

  return { board, selected, handleSelect, combo, isProcessing };
};

// Premium visual helper functions (Class-only toggles)
function premiumMatchEffect(tile: HTMLElement | null) {
  if (!tile) return;
  tile.classList.add("premium-match");
  setTimeout(() => {
    tile.classList.remove("premium-match");
  }, 400);
}

function premiumBoardImpact() {
  const board = document.querySelector(".board");
  if (!board) return;
  board.classList.add("premium-shake");
  setTimeout(() => {
    board.classList.remove("premium-shake");
  }, 280);
}

function updateComboGlow(combo: number) {
  document.body.classList.remove(
    "combo-glow-1",
    "combo-glow-2",
    "combo-glow-3",
    "combo-glow-4",
    "combo-glow-5"
  );
  const level = Math.min(combo, 5);
  if (level > 0) {
    document.body.classList.add("combo-glow-" + level);
  }
}

function triggerEnergyFlow(tile: HTMLElement | null, color: string) {
  if (!tile) return;

  tile.classList.add("energy-flow");

  const map: Record<string, string> = {
    green: "flow-green",
    purple: "flow-purple",
    yellow: "flow-yellow",
    blue: "flow-blue",
    red: "flow-red",
    cyan: "flow-cyan"
  };

  const flowClass = map[color];
  if (!flowClass) return;

  tile.classList.add(flowClass);

  setTimeout(() => {
    tile.classList.remove("energy-flow", flowClass);
  }, 650);
}
