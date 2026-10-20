import type { Player } from "../core/player.js";

export interface IItem {
  readonly type: string;
  readonly stackable: boolean;
  
  onUse?(player: Player): void;
  onDrop?(player: Player): void;
}
