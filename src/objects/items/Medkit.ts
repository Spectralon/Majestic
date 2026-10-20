import type {IItem} from "./IItem";
import type {Player} from "../Player";

export class Medkit implements IItem {
    readonly type = "medkit";
    readonly stackable = true;

    constructor(private _addHP: number) {
    }

    onUse(player: Player): void {
        player.addHP(this._addHP);
    }
}
