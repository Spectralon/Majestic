import type { IItem } from "./IItem.js";
import type { Player } from "../core/player.js";

export class Medkit implements IItem {
  readonly type = "medkit";
  readonly stackable = true;

  constructor(private addHP: number) {}

  onUse(player: Player): void {
    player.addHP(this.addHP);
  }
}
