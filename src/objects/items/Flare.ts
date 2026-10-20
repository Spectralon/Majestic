import type {IItem} from "./IItem";
import type {Player} from "../Player";
import type {FlareService} from "../../services/FlareService";

export class Flare implements IItem {
    readonly type = "flare";
    readonly stackable = true;

    constructor(private _flareService: FlareService) {
    }

    onDrop(player: Player): void {
        this._flareService.applyHighlight(player.position);
    }
}
