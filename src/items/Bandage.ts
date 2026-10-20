import type {IItem} from "./IItem.js";
import type {Player} from "../core/Player";

export class Bandage implements IItem {
    readonly type = "bandage";
    readonly stackable = true;

    constructor(private _healPerTick: number) {
    }

    onUse(player: Player): void {
        player.addHP(this._healPerTick);
    }
}
