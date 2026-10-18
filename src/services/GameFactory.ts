import { Medkit } from "../items/medkit.js";
import { Player } from "../core/player.js";
import { WorldState } from "../core/world.js";
import type { Vec2 } from "../types.js";
import type { StaticDataService } from "./StaticDataService.js";
import type { ItemRegistryService } from "./ItemRegistryService.js";

export class GameFactory {
  private _staticDataService: StaticDataService;
  private _itemRegistry: ItemRegistryService;

  constructor(staticDataService: StaticDataService, itemRegistry: ItemRegistryService) {
    this._staticDataService = staticDataService;
    this._itemRegistry = itemRegistry;
  }

  createGameWorld(): WorldState {
    return new WorldState(this._staticDataService.config);
  }

  createPlayer(id: string, position: Vec2): Player {
    return new Player(id, position, this._staticDataService.config);
  }

  createAllItems(): void {
    const items = this._staticDataService.config.ITEMS;
    this._itemRegistry.register(new Medkit(items.medkit.addHP));
  }
}
