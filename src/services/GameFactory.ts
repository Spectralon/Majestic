import {Medkit} from "../items/Medkit";
import {Armor} from "../items/Armor";
import {Bandage} from "../items/Bandage";
import {Flare} from "../items/Flare";
import {Player} from "../core/Player";
import {WorldState} from "../core/WorldState";
import {ActiveEffect} from "../core/ActiveEffect";
import type {IEffect, Vec2, GroundItem, IItemInstance} from "../types.js";
import type {IItem} from "../items/IItem.js";
import type {GameLoopService} from "./GameLoopService.js";
import type {StaticDataService} from "./StaticDataService.js";
import type {ItemRegistryService} from "./ItemRegistryService.js";
import type {FlareService} from "./FlareService.js";

export class GameFactory {
    private _staticDataService: StaticDataService;
    private _itemRegistry: ItemRegistryService;
    private _gameLoop: GameLoopService;
    private _flareService: FlareService;

    private _groundItemCounter: number = 0;
    private _instanceCounter: number = 0;

    constructor(
        staticDataService: StaticDataService,
        itemRegistry: ItemRegistryService,
        gameLoop: GameLoopService,
        flareService: FlareService,
    ) {
        this._staticDataService = staticDataService;
        this._itemRegistry = itemRegistry;
        this._gameLoop = gameLoop;
        this._flareService = flareService;
    }

    createGameWorld(): WorldState {
        return new WorldState(this._staticDataService.config);
    }

    createPlayer(id: string, position: Vec2): Player {
        const player = new Player(id, position, this._staticDataService.config);
        this._gameLoop.register(player);
        return player;
    }

    createAllItems(): void {
        this.createMedkit();
        this.createArmor();
        this.createBandage();
        this.createFlare();
    }

    createItemInstance(type: string, amount: number): IItemInstance {
        this._instanceCounter++;
        return {id: `inst_${this._instanceCounter}`, type, amount};
    }

    createGroundItem(type: string, position: Vec2): GroundItem {
        this._groundItemCounter++;
        return {
            id: `ground_${this._groundItemCounter}`,
            type,
            position: {...position},
            expiresAtTick: this._gameLoop.world.tick + this._staticDataService.config.GROUND_LIFETIME_TICKS,
        };
    }

    tryCreateEffect(type: string): IEffect | null {
        const items = this._staticDataService.config.ITEMS;
        if (type === "bandage") {
            const effect = new ActiveEffect(type, items.bandage.duration, {
                healPerTick: items.bandage.healPerTick,
            });
            this._gameLoop.register(effect);
            return effect;
        }
        if (type === "flare") {
            const effect = new ActiveEffect(type, items.flare.highlightTicks);
            this._gameLoop.register(effect);
            return effect;
        }
        return null;
    }

    private createMedkit(): IItem {
        const item = new Medkit(this._staticDataService.config.ITEMS.medkit.addHP);
        this._itemRegistry.register(item);
        return item;
    }

    private createArmor(): IItem {
        const item = new Armor(this._staticDataService.config.ITEMS.armor.addArmor);
        this._itemRegistry.register(item);
        return item;
    }

    private createBandage(): IItem {
        const item = new Bandage(this._staticDataService.config.ITEMS.bandage.healPerTick);
        this._itemRegistry.register(item);
        return item;
    }

    private createFlare(): IItem {
        const item = new Flare(this._flareService);
        this._itemRegistry.register(item);
        return item;
    }
}
