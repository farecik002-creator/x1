import type Phaser from "phaser";
import { createPhaserGame } from "./GameScene";

/**
 * Entry point for creating a Phaser game instance.
 * This does not yet integrate with React or the existing board logic;
 * it only prepares a reusable initializer we can call from the UI layer.
 */
export function initPhaserGame(
  parent: string | HTMLElement = "phaser-root",
): Phaser.Game {
  return createPhaserGame(parent);
}

