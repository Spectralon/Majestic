import type {Vec2} from "../objects/data";
import type {GameLoopService} from "../infrastructure/services/GameLoopService";
import type {GameFactory} from "../infrastructure/GameFactory";
import type {StaticDataService} from "../infrastructure/services/StaticDataService";
import {sqrDistance} from "../utils/distance";

export class FlareService {
    private _gameLoop: GameLoopService;
    private _gameFactory: GameFactory | undefined = undefined;

    private readonly _highlightRadiusSqr: number;

    constructor(gameLoop: GameLoopService, staticDataService: StaticDataService) {
        this._gameLoop = gameLoop;
        this._highlightRadiusSqr = staticDataService.config.ITEMS.flare.highlightRadius ** 2;
    }

    initialize(gameFactory: GameFactory): void {
        this._gameFactory = gameFactory;
    }

    applyHighlight(position: Vec2): void {
        if (this._gameFactory === undefined)
            throw new Error("FlareService: call initialize() first");
        const effect = this._gameFactory.tryCreateEffect("flare");
        if (!effect)
            return;
        for (const player of this._gameLoop.world.getPlayers())
            if (sqrDistance(player.position, position) <= this._highlightRadiusSqr)
                player.addEffect(effect);
    }
}
