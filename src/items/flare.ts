import type { IItem } from "./IItem.js";
import type { Player } from "../core/player.js";
import type { FlareService } from "../services/FlareService.js";

export class Flare implements IItem {
  readonly type = "flare";
  readonly stackable = true;

  constructor(private _flareService: FlareService) {}

  onDrop(player: Player): void {
    this._flareService.applyHighlight(player.position);
  }
}
