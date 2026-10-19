import { Medkit } from "../items/medkit.js";
import { Armor } from "../items/armor.js";
import { Bandage } from "../items/bandage.js";
import { Flare } from "../items/flare.js";
import { Player } from "../core/player.js";
import { WorldState } from "../core/world.js";
import { ActiveEffect } from "../core/effect.js";
import type { IEffect, Vec2 } from "../types.js";
import type { IItem } from "../items/IItem.js";
import type { GameLoopService } from "./GameLoopService.js";
import type { StaticDataService } from "./StaticDataService.js";
import type { ItemRegistryService } from "./ItemRegistryService.js";

export class GameFactory {
  private _staticDataService: StaticDataService;
  private _itemRegistry: ItemRegistryService;
  private _gameLoop: GameLoopService;

  constructor(
    staticDataService: StaticDataService,
    itemRegistry: ItemRegistryService,
    gameLoop: GameLoopService,
  ) {
    this._staticDataService = staticDataService;
    this._itemRegistry = itemRegistry;
    this._gameLoop = gameLoop;
  }

  createGameWorld(): WorldState {
    return new WorldState(this._staticDataService.config);
  }

  createPlayer(id: string, position: Vec2): Player {
    const player = new Player(id, position, this._staticDataService.config);
    this._gameLoop.register(player);
    return player;
  }

  createMedkit(): IItem {
    const item = new Medkit(this._staticDataService.config.ITEMS.medkit.addHP);
    this._itemRegistry.register(item);
    return item;
  }

  createArmor(): IItem {
    const item = new Armor(this._staticDataService.config.ITEMS.armor.addArmor);
    this._itemRegistry.register(item);
    return item;
  }

  createBandage(): IItem {
    const item = new Bandage(this._staticDataService.config.ITEMS.bandage.healPerTick);
    this._itemRegistry.register(item);
    return item;
  }

  createFlare(): IItem {
    const item = new Flare();
    this._itemRegistry.register(item);
    return item;
  }

  createAllItems(): void {
    this.createMedkit();
    this.createArmor();
    this.createBandage();
    this.createFlare();
  }

  createEffect(type: string): IEffect {
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
    throw new Error(`createEffect: unknown effect type: ${type}`);
  }
}
