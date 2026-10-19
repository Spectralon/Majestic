import type { WorldState } from "../core/world.js";
import type { IStorage } from "../storage/IStorage.js";
import type { ITickable, WorldSnapshot } from "../types.js";

export class GameLoopService {
  private _world: WorldState | undefined = undefined;
  private _tickables: ITickable[] = [];

  constructor(
    private _storage: IStorage,
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
  }

  stop(): void {
  }

  tick(): void {
    this._tickables.forEach((tickable) => {
      if (tickable !== null) {
        tickable.tick();
      }
    });
    this._tickables = this._tickables.filter((tickable) => tickable !== null);
  }
}
