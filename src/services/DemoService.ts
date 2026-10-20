import type {GameLoopService} from "./GameLoopService.js";
import type {GameFactory} from "./GameFactory.js";
import type {InventoryService} from "./InventoryService.js";
import type {StaticDataService} from "./StaticDataService.js";
import {sqrDistance} from "../utils/distance.js";
import {GroundItem, Vec2} from "../types.js";
import {WorldState} from "../core/WorldState";
import {Player} from "../core/Player";

export class DemoService {
    private readonly _p1Position: Vec2 = {x: 100, y: 300};
    private readonly _p2Position: Vec2 = {x: 700, y: 300};
    private readonly _flareSpot: Vec2 = {x: 200, y: 150};
    private readonly _bandageSpot: Vec2 = {x: 600, y: 450};
    private readonly _medkitSpot: Vec2 = {x: 400, y: 500};

    private readonly _pickupRadiusSqr;

    private _gameFactory: GameFactory;
    private _inventoryService: InventoryService;

    private _world: WorldState;

    private _running: boolean = false;
    private _runCounter: number = 0;

    constructor(
        gameLoop: GameLoopService,
        gameFactory: GameFactory,
        inventoryService: InventoryService,
        staticDataService: StaticDataService,
    ) {
        this._world = gameLoop.world;
        this._gameFactory = gameFactory;
        this._inventoryService = inventoryService;
        this._pickupRadiusSqr = staticDataService.config.PLAYER.pickupRadius ** 2;
    }

    start(): void {
        if (this._running)
            return;
        this._running = true;
        this.runScenario().catch((err) => {
            console.error("[demo] scenario failed:", err);
            this._running = false;
        });
    }

    private async runScenario(): Promise<void> {
        this._runCounter++;

        const {p1, p2} = this.createPlayers();
        const {flareDrop, bandageDrop} = await this.createDrop();

        await this.delay(1000);

        await this.moveTowardsDrops(p1, p2, flareDrop, bandageDrop);

        await this._inventoryService.pickup(p1.id, flareDrop.id);
        await this._inventoryService.pickup(p2.id, bandageDrop.id);

        await this.delay(1000);

        await this._inventoryService.drop(p1.id, "flare");
        await this._inventoryService.use(p2.id, "bandage");

        await this.delay(1000);

        const midDrop = await this.createMidDrop(p1, p2);
        await this.raceForDrop(p1, p2, midDrop);

        this._running = false;
        console.log(`[demo] scenario ${(this._runCounter)} complete`);
    }

    private createPlayers(): { p1: Player; p2: Player } {
        const p1 = this._gameFactory.createPlayer(`demo${(this._runCounter)}_p1`, this._p1Position);
        const p2 = this._gameFactory.createPlayer(`demo${(this._runCounter)}_p2`, this._p2Position);
        this._world.addPlayer(p1);
        this._world.addPlayer(p2);
        return {p1, p2};
    }

    private async createDrop(): Promise<{ bandageDrop: GroundItem; flareDrop: GroundItem }> {
        const known = new Set(this._world.getGroundItems().map((item) => item.id));
        await this._inventoryService.spawnItem("flare", this._flareSpot);
        await this._inventoryService.spawnItem("bandage", this._bandageSpot);
        await this._inventoryService.spawnItem("medkit", this._medkitSpot);
        const spawned = this._world.getGroundItems().filter((item) => !known.has(item.id));
        const flareDrop = spawned[0];
        const bandageDrop = spawned[1];
        const medkitDrop = spawned[2];
        return {flareDrop, bandageDrop};
    }

    private async moveTowardsDrops(p1: Player, p2: Player, flareDrop: GroundItem, bandageDrop: GroundItem) {
        p1.setTarget(this._flareSpot);
        p2.setTarget(this._bandageSpot);
        await this.waitFor(
            () =>
                sqrDistance(p1.position, flareDrop.position) <= this._pickupRadiusSqr &&
                sqrDistance(p2.position, bandageDrop.position) <= this._pickupRadiusSqr,
            30000,
        );
    }

    private async createMidDrop(p1: Player, p2: Player): Promise<GroundItem> {
        const mid: Vec2 = {
            x: (p1.position.x + p2.position.x) / 2,
            y: (p1.position.y + p2.position.y) / 2,
        };
        const knownMid = new Set(this._world.getGroundItems().map((item) => item.id));
        await this._inventoryService.spawnItem("medkit", mid);
        const midDrop = this._world.getGroundItems().find((item) => !knownMid.has(item.id));
        if (!midDrop)
            throw new Error("demo: midpoint drop not found");
        return midDrop;
    }

    private async raceForDrop(p1: Player, p2: Player, midDrop: GroundItem) {
        p1.setTarget(midDrop.position);
        p2.setTarget(midDrop.position);
        await this.waitFor(
            () =>
                sqrDistance(p1.position, midDrop.position) <= this._pickupRadiusSqr &&
                sqrDistance(p2.position, midDrop.position) <= this._pickupRadiusSqr,
            30000,
        );
        p1.setTarget(p1.position);
        p2.setTarget(p2.position);

        await Promise.allSettled([
            this._inventoryService.pickup(p1.id, midDrop.id),
            this._inventoryService.pickup(p2.id, midDrop.id),
        ]);
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private async waitFor(predicate: () => boolean, timeoutMs: number): Promise<void> {
        const deadline = Date.now() + timeoutMs;
        while (!predicate()) {
            if (Date.now() >= deadline) throw new Error("demo: wait timeout");
            await this.delay(100);
        }
    }
}
