import type {IItem} from "./IItem";
import type {Player} from "../Player";

export class Armor implements IItem {
    readonly type = "armor";
    readonly stackable = false;

    constructor(private _addArmor: number) {
    }

    onUse(player: Player): void {
        player.addArmor(this._addArmor);
    }
}
