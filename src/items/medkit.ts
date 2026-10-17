import type { IItem } from "./IItem.js";
import type { Player } from "../core/player.js";
import { config } from "../config.js";
import { registerItem } from "./registry.js";

class Medkit implements IItem {
  readonly type = "medkit";
  readonly stackable = true;

  onUse(player: Player): void {
    player.addHP(config.ITEMS.medkit.addHP);
  }
}

registerItem(new Medkit());
