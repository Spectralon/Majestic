import type { WorldState } from "../core/world.js";
import type { IStorage } from "../storage/IStorage.js";
import type { EffectService } from "./EffectService.js";
import type { GameFactory } from "./GameFactory.js";
import type { WorldSnapshot } from "../types.js";

export class GameLoopService {
  private _world: WorldState | undefined = undefined;

  constructor(
    private gameFactory: GameFactory,
    private effectService: EffectService,
    private storage: IStorage,
    private broadcast: (snapshot: WorldSnapshot) => void,
  ) {}

  initialize(): void {
    this._world = this.gameFactory.createGameWorld();
  }

  get world(): WorldState {
    if (this._world === undefined) {
      throw new Error("GameLoopService: call initialize() first");
    }
    return this._world;
  }

  start(): void {
  }

  stop(): void {
  }

  tick(): void {
  }
}
