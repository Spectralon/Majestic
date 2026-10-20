import type {ITickable} from "../types.js";
import type {GameLoopService} from "./GameLoopService.js";
import type {IStorage} from "../storage/IStorage.js";

export class GroundItemService implements ITickable {
    private _gameLoop: GameLoopService;
    private _storage: IStorage;

    constructor(gameLoop: GameLoopService, storage: IStorage) {
        this._gameLoop = gameLoop;
        this._storage = storage;
    }

    initialize(): void {
        this._gameLoop.register(this);
    }

    tick(): boolean {
        const world = this._gameLoop.world;
        const expired =
            world
                .getGroundItems()
                .filter((g) => g.expiresAtTick <= world.tick);

        for (const item of expired) {
            world.removeGroundItem(item.id);
            this._storage.deleteGroundItem(item.id);
        }
        return true;
    }
}
