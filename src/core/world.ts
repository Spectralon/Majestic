import { Player } from "./player.js";
import type { GroundItem, ItemInstance, Vec2, WorldSnapshot } from "../types.js";
import { config } from "../config.js";

export class WorldState {
  private _tick: number = 0;
  private _players: Map<string, Player> = new Map();
  private _groundItems: Map<string, GroundItem> = new Map();
  private _inventories: Map<string, ItemInstance[]> = new Map();

  get tick(): number {
    return this._tick;
  }

  addPlayer(id: string, position: Vec2): Player {
    if (!id) throw new Error("Player id must be non-empty");
    const player = new Player(id, position);
    this._players.set(player.id, player);
    this._inventories.set(player.id, []);
    return player;
  }

  removePlayer(playerId: string): void {
    if (!this._players.has(playerId)) throw new Error(`Player not found: ${playerId}`);
    this._players.delete(playerId);
    this._inventories.delete(playerId);
  }

  getPlayer(playerId: string): Player | undefined {
    return this._players.get(playerId);
  }

  getPlayers(): Player[] {
    return Array.from(this._players.values());
  }

  addGroundItem(item: GroundItem): void {
    if (!item.id) throw new Error("Ground item id must be non-empty");
    if (!item.type) throw new Error("Ground item type must be non-empty");
    this.assertWithinBounds(item.position, "ground item");
    this._groundItems.set(item.id, item);
  }

  removeGroundItem(itemId: string): void {
    if (!this._groundItems.has(itemId)) throw new Error(`Ground item not found: ${itemId}`);
    this._groundItems.delete(itemId);
  }

  getGroundItems(): GroundItem[] {
    return Array.from(this._groundItems.values());
  }

  getInventory(playerId: string): ItemInstance[] {
    return this._inventories.get(playerId) ?? [];
  }

  setInventory(playerId: string, items: ItemInstance[]): void {
    if (!this._players.has(playerId)) throw new Error(`Player not found: ${playerId}`);
    this._inventories.set(playerId, items);
  }

  advanceTick(): void {
    this._tick++;
  }

  getSnapshot(): WorldSnapshot {
    return {
      tick: this._tick,
      players: this.getPlayers().map((player) => player.toData()),
      groundItems: this.getGroundItems(),
      inventories: Object.fromEntries(this._inventories.entries()),
    };
  }

  private assertWithinBounds(pos: Vec2, label: string): void {
    if (pos.x < 0 || pos.x > config.WORLD_WIDTH || pos.y < 0 || pos.y > config.WORLD_HEIGHT) {
      throw new Error(`${label} position out of bounds: (${pos.x}, ${pos.y})`);
    }
  }
}
