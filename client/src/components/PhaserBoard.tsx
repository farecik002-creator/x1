import { useEffect, useRef } from "react";
import type Phaser from "phaser";
import type { BoardState } from "@/hooks/useMatch3";
import { initPhaserGame } from "@/phaser/main";
import { GameScene } from "@/phaser/GameScene";

interface PhaserBoardProps {
  board: BoardState;
}

/**
 * React ↔ Phaser bridge:
 * - Mounts a Phaser game into a local div container.
 * - On every board state change from useMatch3, forwards the data
 *   into the GameScene.renderBoard(board) view method.
 *
 * This component does not change any gameplay logic; it only mirrors
 * the existing logical board into Phaser for rendering.
 */
export function PhaserBoard({ board }: PhaserBoardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<GameScene | null>(null);

  // Initialize Phaser once when the component mounts.
  useEffect(() => {
    if (!containerRef.current) return;
    if (gameRef.current) return;

    const parent = containerRef.current;
    const game = initPhaserGame(parent);
    gameRef.current = game;

    const scene = game.scene.getScene("GameScene") as GameScene | undefined;
    if (scene) {
      sceneRef.current = scene;
    }

    return () => {
      sceneRef.current = null;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  // Whenever the logical board changes, ask the scene to re-render.
  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;

    let scene = sceneRef.current;
    if (!scene) {
      const fetched = game.scene.getScene("GameScene") as GameScene | undefined;
      if (!fetched) return;
      scene = fetched;
      sceneRef.current = fetched;
    }

    scene.renderBoard(board);
  }, [board]);

  return <div id="phaser-root" ref={containerRef} className="w-full h-full" />;
}



