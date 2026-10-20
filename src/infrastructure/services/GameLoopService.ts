import type {World} from "../../objects/World";
import type {WorldSnapshot} from "../../objects/data";
import type {ITickable} from "../../objects/abstract";
import type {StaticDataService} from "./StaticDataService";

export class GameLoopService {
    private _world: World | undefined = undefined;

    private readonly _tickIntervalMs: number;

    private _listeners: ((snapshot: WorldSnapshot) => void)[] = [];

    private _tickables: ITickable[] = [];

    private _interval: NodeJS.Timeout | undefined = undefined;

    constructor(staticDataService: StaticDataService) {
        this._tickIntervalMs = staticDataService.config.TICK_INTERVAL_MS;
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

    onSnapshot(listener: (snapshot: WorldSnapshot) => void): void {
        this._listeners.push(listener);
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
        const snapshot = this.world.getSnapshot();
        for (const listener of this._listeners)
            listener(snapshot);
    }
}
