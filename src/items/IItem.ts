import type { Player } from "../types.js";
import type { WorldState } from "../core/world.js";

export interface IItem {
  readonly type: string;
  readonly stackable: boolean;
  onUse?(player: Player, world: WorldState): void;
}
