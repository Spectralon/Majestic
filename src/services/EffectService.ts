import type { ITickable } from "../types.js";
import type { GameLoopService } from "./GameLoopService.js";

export class EffectService implements ITickable {
  private _gameLoop: GameLoopService;

  constructor(gameLoop: GameLoopService) {
    this._gameLoop = gameLoop;
  }

  initialize(): void {
    this._gameLoop.register(this);
  }

  tick(): void {
  }
}
