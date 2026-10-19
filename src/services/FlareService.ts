import type { Vec2 } from "../types.js";
import type { GameLoopService } from "./GameLoopService.js";
import type { GameFactory } from "./GameFactory.js";
import type { StaticDataService } from "./StaticDataService.js";
import { sqrDistance } from "../utils/distance.js";

export class FlareService {
  private _gameLoop: GameLoopService;
  private _gameFactory: GameFactory | undefined = undefined;
  private _highlightRadiusSqr: number;

  constructor(gameLoop: GameLoopService, staticDataService: StaticDataService) {
    this._gameLoop = gameLoop;
    const radius = staticDataService.config.ITEMS.flare.highlightRadius;
    this._highlightRadiusSqr = radius * radius;
  }

  initialize(gameFactory: GameFactory): void {
    this._gameFactory = gameFactory;
  }

  applyHighlight(position: Vec2): void {
    if (this._gameFactory === undefined) throw new Error("FlareService: call initialize() first");
    const effect = this._gameFactory.createEffectOrNull("flare");
    if (!effect) return;
    for (const player of this._gameLoop.world.getPlayers()) {
      if (sqrDistance(player.position, position) <= this._highlightRadiusSqr) {
        player.addEffect(effect);
      }
    }
  }
}
