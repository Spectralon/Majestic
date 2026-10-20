import type {ITickable} from "../objects/abstract";
import type {GameLoopService} from "../infrastructure/services/GameLoopService";
import type {IStorage} from "../infrastructure/storage/IStorage";

export class GroundItemService implements ITickable {
    private readonly _gameLoop: GameLoopService;
    private readonly _storage: IStorage;

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
