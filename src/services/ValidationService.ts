import type { GameLoopService } from "./GameLoopService.js";
import type { ItemRegistryService } from "./ItemRegistryService.js";
import type { StaticDataService } from "./StaticDataService.js";
import { sqrDistance } from "../utils/distance.js";

export type ValidationResult = { ok: true } | { ok: false; reason: string };

export class ValidationService {
  private _gameLoop: GameLoopService;
  private _itemRegistry: ItemRegistryService;
  private _staticDataService: StaticDataService;

  constructor(
    gameLoop: GameLoopService,
    itemRegistry: ItemRegistryService,
    staticDataService: StaticDataService,
  ) {
    this._gameLoop = gameLoop;
    this._itemRegistry = itemRegistry;
    this._staticDataService = staticDataService;
  }

  validateMove(playerId: string, x: number, y: number): ValidationResult {
    this._gameLoop.world.getPlayer(playerId);
    const { WORLD_WIDTH, WORLD_HEIGHT } = this._staticDataService.config;
    if (x < 0 || x > WORLD_WIDTH || y < 0 || y > WORLD_HEIGHT) {
      return { ok: false, reason: "position out of bounds" };
    }
    return { ok: true };
  }

  validatePickup(playerId: string, groundItemId: string): ValidationResult {
    const world = this._gameLoop.world;
    const player = world.getPlayer(playerId);
    const groundItem = world.getGroundItemById(groundItemId);
    const radius = this._staticDataService.config.PLAYER.pickupRadius;
    if (sqrDistance(player.position, groundItem.position) > radius * radius) {
      return { ok: false, reason: "ground item out of range" };
    }
    return { ok: true };
  }

  validateUse(playerId: string, itemId: string): ValidationResult {
    const player = this._gameLoop.world.getPlayer(playerId);
    const instance = player.inventory.items.find((candidate) => candidate.id === itemId);
    if (!instance) {
      return { ok: false, reason: "item not in inventory" };
    }
    const item = this._itemRegistry.get(instance.type);
    if (!item.onUse) {
      return { ok: false, reason: "item cannot be used" };
    }
    return { ok: true };
  }

  validateDrop(playerId: string, itemId: string): ValidationResult {
    const player = this._gameLoop.world.getPlayer(playerId);
    const instance = player.inventory.items.find((candidate) => candidate.id === itemId);
    if (!instance) {
      return { ok: false, reason: "item not in inventory" };
    }
    this._itemRegistry.get(instance.type);
    return { ok: true };
  }
}
