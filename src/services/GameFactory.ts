import { Medkit } from "../items/medkit.js";
import { Player } from "../core/player.js";
import { WorldState } from "../core/world.js";
import type { Vec2 } from "../types.js";
import type { StaticDataService } from "./StaticDataService.js";
import type { ItemRegistryService } from "./ItemRegistryService.js";

export class GameFactory {
  private staticDataService: StaticDataService;
  private itemRegistry: ItemRegistryService;
  private world: WorldState | undefined = undefined;

  constructor(staticDataService: StaticDataService, itemRegistry: ItemRegistryService) {
    this.staticDataService = staticDataService;
    this.itemRegistry = itemRegistry;
  }

  createGameWorld(): WorldState {
    if (this.world !== undefined) {
      throw new Error("createGameWorld: world already exists");
    }
    this.world = new WorldState(this.staticDataService.config);
    return this.world;
  }

  private requireWorld(): WorldState {
    if (this.world === undefined) {
      throw new Error("call createGameWorld first");
    }
    return this.world;
  }

  createPlayer(id: string, position: Vec2): Player {
    const player = new Player(id, position, this.staticDataService.config);
    this.requireWorld().addPlayer(player);
    return player;
  }

  createAllItems(): void {
    const items = this.staticDataService.config.ITEMS;
    this.itemRegistry.register(new Medkit(items.medkit.addHP));
  }
}
