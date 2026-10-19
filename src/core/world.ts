import { Player } from "./player.js";
import type { GroundItem, ItemInstance, WorldSnapshot } from "../types.js";
import { validatePosition } from "../utils/validation.js";

export class WorldState {
  private readonly _config: any;
  private _tick: number = 0;
  private _players: Map<string, Player> = new Map();
  private _groundItems: Map<string, GroundItem> = new Map();

  constructor(config: any) {
    this._config = config;
  }

  get tick(): number {
    return this._tick;
  }

  addPlayer(player: Player): void {
    if (this._players.has(player.id))
      throw new Error(`Player already exists: ${player.id}`);
    this._players.set(player.id, player);
  }

  removePlayer(playerId: string): void {
    if (!this._players.has(playerId))
      throw new Error(`Player not found: ${playerId}`);
    this._players.delete(playerId);
  }

  getPlayer(playerId: string): Player {
    if (!this._players.has(playerId))
      throw new Error(`Player not found: ${playerId}`);
    return this._players.get(playerId) as Player;
  }

  getPlayers(): Player[] {
    return Array.from(this._players.values());
  }

  addGroundItem(item: GroundItem): void {
    if (!item.id)
      throw new Error("Ground item id must be non-empty");
    if (!item.type)
      throw new Error("Ground item type must be non-empty");
    validatePosition(item.position, this._config.WORLD_WIDTH, this._config.WORLD_HEIGHT, "ground item position");
    this._groundItems.set(item.id, item);
  }

  removeGroundItem(itemId: string): void {
    if (!this._groundItems.has(itemId)) throw new Error(`Ground item not found: ${itemId}`);
    this._groundItems.delete(itemId);
  }

  getGroundItemById(id: string): GroundItem {
    const item = this.getGroundItems().find((g) => g.id === id);
    if (!item) throw new Error(`Ground item not found: ${item}`);
    return item;
  }

  getGroundItems(): GroundItem[] {
    return Array.from(this._groundItems.values());
  }

  advanceTick(): void {
    this._tick++;
  }

  getSnapshot(): WorldSnapshot {
    return {
      tick: this._tick,
      players: this.getPlayers().map((player) => player.toData()),
      groundItems: this.getGroundItems(),
      inventories: Object.fromEntries(this.getPlayers().map((p) => [p.id, [...p.inventory.items]])),
    };
  }
}
