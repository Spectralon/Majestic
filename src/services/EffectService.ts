import type {ITickable} from "../types.js";
import type {GameLoopService} from "./GameLoopService.js";
import type {ItemRegistryService} from "./ItemRegistryService.js";

export class EffectService implements ITickable {
    private _itemRegistry: ItemRegistryService;
    private _gameLoop: GameLoopService;

    constructor(gameLoop: GameLoopService, itemRegistry: ItemRegistryService) {
        this._gameLoop = gameLoop;
        this._itemRegistry = itemRegistry;
    }

    initialize(): void {
        this._gameLoop.register(this);
    }

    tick(): boolean {
        const world = this._gameLoop.world;
        for (const player of world.getPlayers())
            for (const effect of player.effects) {
                const item = this._itemRegistry.get(effect.type);
                if (item?.onUse)
                    item.onUse(player);
            }
        return true;
    }
}
