import Phaser from "phaser";
import type { BoardState } from "../hooks/useMatch3";

export const DEFAULT_BOARD_ROWS = 8;
export const DEFAULT_BOARD_COLS = 8;
export const TILE_SIZE = 64;

type TileSpriteGrid = (Phaser.GameObjects.Sprite | null)[][];

export class GameScene extends Phaser.Scene {
  private boardContainer!: Phaser.GameObjects.Container;
  private tileSprites: TileSpriteGrid = [];
  private onTileSelect?: (r: number, c: number) => void;

  constructor() {
    super("GameScene");
  }

  preload() {
    // Real gem art – reuse the same assets as the React board.
    this.load.image("gem-blue", "/gems/blue.png");
    this.load.image("gem-red", "/gems/red.png");
    this.load.image("gem-green", "/gems/green.png");
    this.load.image("gem-yellow", "/gems/yell.png");
    this.load.image("gem-purple", "/gems/purp.png");
    this.load.image("gem-cyan", "/gems/cya.png");

    // Fallback placeholder for any unknown types.
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRoundedRect(0, 0, TILE_SIZE, TILE_SIZE, 8);
    graphics.lineStyle(2, 0xcccccc, 1);
    graphics.strokeRoundedRect(0, 0, TILE_SIZE, TILE_SIZE, 8);
    graphics.generateTexture("placeholder-tile", TILE_SIZE, TILE_SIZE);
    graphics.destroy();
  }

  create() {
    const width = DEFAULT_BOARD_COLS * TILE_SIZE;
    const height = DEFAULT_BOARD_ROWS * TILE_SIZE;

    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Container that will hold all tile sprites for the match-3 board.
    this.boardContainer = this.add.container(centerX - width / 2, centerY - height / 2);

    // Prepare an empty 2D grid for tile sprites. This mirrors the logical
    // board structure from useMatch3, but does not yet bind to it.
    this.tileSprites = Array.from({ length: DEFAULT_BOARD_ROWS }, () =>
      Array.from({ length: DEFAULT_BOARD_COLS }, () => null),
    );
  }

  setTileSelectHandler(handler: ((r: number, c: number) => void) | undefined) {
    this.onTileSelect = handler;
  }

  private getTextureKeyForType(type: string): string {
    switch (type) {
      case "blue":
        return "gem-blue";
      case "red":
        return "gem-red";
      case "green":
        return "gem-green";
      case "yellow":
        return "gem-yellow";
      case "purple":
        return "gem-purple";
      case "cyan":
        return "gem-cyan";
      default:
        return "placeholder-tile";
    }
  }

  /**
   * Render the logical match-3 board into Phaser sprites.
   * This is a pure view layer: it receives the current BoardState from useMatch3
   * and mirrors it using placeholder-tile sprites inside boardContainer.
   */
  renderBoard(board: BoardState) {
    if (!this.boardContainer) return;
    const rows = board.length;
    const cols = rows > 0 ? board[0].length : 0;
    if (!rows || !cols) return;

    // If the logical board size changes, rebuild our sprite grid to match.
    if (
      this.tileSprites.length !== rows ||
      (this.tileSprites[0] && this.tileSprites[0].length !== cols)
    ) {
      this.initializeSpriteGrid(rows, cols);
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const gem = board[r][c];
        let sprite = this.tileSprites[r][c];

        const x = c * TILE_SIZE + TILE_SIZE / 2;
        const y = r * TILE_SIZE + TILE_SIZE / 2;
        const textureKey = this.getTextureKeyForType(gem.type);

        // Empty tiles are not rendered; remove any existing sprite.
        if (gem.type === "empty") {
          if (sprite) {
            sprite.destroy();
            this.tileSprites[r][c] = null;
          }
          continue;
        }

        if (!sprite) {
          sprite = this.add.sprite(x, y, textureKey);
          sprite.setOrigin(0.5);
          sprite.setInteractive({ useHandCursor: true });
          sprite.on("pointerup", () => {
            if (this.onTileSelect) {
              this.onTileSelect(r, c);
            }
          });
          this.boardContainer.add(sprite);
          this.tileSprites[r][c] = sprite;
        } else {
          if (sprite.texture.key !== textureKey) {
            sprite.setTexture(textureKey);
          }
          sprite.setPosition(x, y);
          sprite.setVisible(true);
        }
      }
    }
  }

  /**
   * Prepare (but do not yet populate) the sprite grid for a given board size.
   * This will be used when we hook the scene up to the existing match-3 data.
   */
  initializeSpriteGrid(rows: number, cols: number) {
    this.boardContainer.removeAll(true);

    this.tileSprites = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => null),
    );
  }
}

export function createPhaserGame(parent: string | HTMLElement): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    transparent: true,
    width: DEFAULT_BOARD_COLS * TILE_SIZE,
    height: DEFAULT_BOARD_ROWS * TILE_SIZE,
    parent,
    scene: [GameScene],
    physics: {
      default: "arcade",
      arcade: {
        debug: false,
      },
    },
  };

  return new Phaser.Game(config);
}

