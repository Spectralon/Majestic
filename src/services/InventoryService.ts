import type { IStorage } from "../storage/IStorage.js";
import type { GameLoopService } from "./GameLoopService.js";
import type { ItemRegistryService } from "./ItemRegistryService.js";
import type { GameFactory } from "./GameFactory.js";
import type { StaticDataService } from "./StaticDataService.js";
import type { ItemInstance, Vec2 } from "../types.js";
import { sqrDistance } from "../utils/distance.js";
import {WorldState} from "../core/world";

export class InventoryService {
  private _storage: IStorage;
  private _itemRegistry: ItemRegistryService;
  private _gameFactory: GameFactory;

  private readonly _world: WorldState;
  private readonly _pickupRadiusSqr: number;

  constructor(
      gameLoop: GameLoopService,
      storage: IStorage,
      itemRegistry: ItemRegistryService,
      gameFactory: GameFactory,
      staticDataService: StaticDataService,
  ) {
    this._storage = storage;
    this._itemRegistry = itemRegistry;
    this._gameFactory = gameFactory;
    this._world = gameLoop.world;
    const r = staticDataService.config.PLAYER.pickupRadius;
    this._pickupRadiusSqr = r * r;
  }

  getInventory(playerId: string): ItemInstance[] {
    const player = this._world.getPlayer(playerId);
    return [...player.inventory.items];
  }

  async give(playerId: string, type: string, amount: number = 1): Promise<void> {
    const player = this._world.getPlayer(playerId);
    const item = this._itemRegistry.get(type);

    if (!Number.isInteger(amount) || amount < 1)
      throw new Error("give: amount must be a positive integer");

    const instance = this._gameFactory.createItemInstance(type, amount);
    player.inventory.addItem(item, instance);
    await this._storage.saveInventory(playerId, [...player.inventory.items]);
  }

  async drop(playerId: string, type: string): Promise<void> {
    const player = this._world.getPlayer(playerId);
    const item = this._itemRegistry.get(type);

    player.inventory.removeItem(item);
    await this._storage.saveInventory(playerId, [...player.inventory.items]);

    const groundItem = this._gameFactory.createGroundItem(type, player.position);
    this._world.addGroundItem(groundItem);
    item.onDrop?.(player);
    await this._storage.saveGroundItem(groundItem);
  }

  async spawnItem(type: string, position: Vec2): Promise<void> {
    const groundItem = this._gameFactory.createGroundItem(type, position);
    this._world.addGroundItem(groundItem);
    await this._storage.saveGroundItem(groundItem);
  }

  async pickup(playerId: string, groundItemId: string): Promise<void> {
    const player = this._world.getPlayer(playerId);

    const groundItem = this._world.getGroundItemById(groundItemId);

    if (sqrDistance(player.position, groundItem.position) > this._pickupRadiusSqr)
      throw new Error("pickup: ground item out of range");

    const item = this._itemRegistry.get(groundItem.type);

    this._world.removeGroundItem(groundItemId);
    await this._storage.deleteGroundItem(groundItemId);

    const instance = this._gameFactory.createItemInstance(groundItem.type, 1);
    player.inventory.addItem(item, instance);
    await this._storage.saveInventory(playerId, [...player.inventory.items]);
  }

  async use(playerId: string, type: string): Promise<void> {
    const player = this._world.getPlayer(playerId);
    const item = this._itemRegistry.get(type);

    const effect = this._gameFactory.createEffectOrNull(type);
    if (effect) {
      player.addEffect(effect);
    } else if (item.onUse) {
      item.onUse(player);
    }

    player.inventory.removeItem(item);
    await this._storage.saveInventory(playerId, [...player.inventory.items]);
  }

  async loadInventory(playerId: string): Promise<void> {
    const player = this._world.getPlayer(playerId);

    const items = await this._storage.loadInventory(playerId);
    if (!items) return;
    player.inventory.load(items);
  }
}
