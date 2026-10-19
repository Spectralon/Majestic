import type { WorldState } from "../core/world.js";
import type { ITickable, WorldSnapshot } from "../types.js";

export class GameLoopService {
  private _world: WorldState | undefined = undefined;
  private _tickables: ITickable[] = [];
  private _interval: NodeJS.Timeout | undefined = undefined;

  constructor(
    private _tickIntervalMs: number,
    private _broadcast: (snapshot: WorldSnapshot) => void,
  ) {}

  initialize(world: WorldState): void {
    this._world = world;
  }

  get world(): WorldState {
    if (this._world === undefined) {
      throw new Error("GameLoopService: call initialize() first");
    }
    return this._world;
  }

  register(tickable: ITickable): void {
    this._tickables.push(tickable);
  }

  start(): void {
    this._interval = setInterval(() => this.tick(), this._tickIntervalMs);
  }

  stop(): void {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = undefined;
    }
  }

  tick(): void {
    this._tickables.forEach((tickable) => {
      if (tickable !== null) {
        tickable.tick();
      }
    });
    this._tickables = this._tickables.filter((tickable) => tickable !== null);

    this.world.advanceTick();

    this._broadcast(this.world.getSnapshot());
  }
}
