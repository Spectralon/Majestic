import type {World} from "../../objects/World";
import type {WorldSnapshot} from "../../objects/data";
import type {ITickable} from "../../objects/abstract";

export class GameLoopService {
    private _world: World | undefined = undefined;

    private _tickables: ITickable[] = [];

    private _interval: NodeJS.Timeout | undefined = undefined;

    constructor(
        private _tickIntervalMs: number,
        private _broadcast: (snapshot: WorldSnapshot) => void,
    ) {
    }

    initialize(world: World): void {
        this._world = world;
    }

    get world(): World {
        if (this._world === undefined)
            throw new Error("GameLoopService: call initialize() first");
        return this._world;
    }

    register(tickable: ITickable): void {
        this._tickables.push(tickable);
    }

    start(): void {
        this._interval = setInterval(() => this.tick(), this._tickIntervalMs);
    }

    stop(): void {
        if (!this._interval)
            return;
        clearInterval(this._interval);
        this._interval = undefined;
    }

    tick(): void {
        this._tickables = this._tickables.filter((tickable) => tickable.tick());
        this.world.advanceTick();
        this._broadcast(this.world.getSnapshot());
    }
}
