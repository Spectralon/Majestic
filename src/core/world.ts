import type { Player, GroundItem, ItemInstance, WorldSnapshot, Vec2 } from "../types.js";
import { config } from "../config.js";

export class WorldState {
  tick: number = 0;
  players: Map<string, Player> = new Map();
  groundItems: Map<string, GroundItem> = new Map();
  inventories: Map<string, ItemInstance[]> = new Map();

  addPlayer(player: Player): void {
    if (!player.id) throw new Error("Player id must be non-empty");
    this.assertWithinBounds(player.position, "player");
    this.players.set(player.id, player);
    this.inventories.set(player.id, []);
  }

  removePlayer(playerId: string): void {
    if (!this.players.has(playerId)) throw new Error(`Player not found: ${playerId}`);
    this.players.delete(playerId);
    this.inventories.delete(playerId);
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  addGroundItem(item: GroundItem): void {
    if (!item.id) throw new Error("Ground item id must be non-empty");
    if (!item.type) throw new Error("Ground item type must be non-empty");
    this.assertWithinBounds(item.position, "ground item");
    this.groundItems.set(item.id, item);
  }

  removeGroundItem(itemId: string): void {
    if (!this.groundItems.has(itemId)) throw new Error(`Ground item not found: ${itemId}`);
    this.groundItems.delete(itemId);
  }

  getGroundItems(): GroundItem[] {
    return Array.from(this.groundItems.values());
  }

  getInventory(playerId: string): ItemInstance[] {
    return this.inventories.get(playerId) ?? [];
  }

  setInventory(playerId: string, items: ItemInstance[]): void {
    if (!this.players.has(playerId)) throw new Error(`Player not found: ${playerId}`);
    this.inventories.set(playerId, items);
  }

  advanceTick(): void {
    this.tick++;
  }

  getSnapshot(): WorldSnapshot {
    return {
      tick: this.tick,
      players: Array.from(this.players.values()),
      groundItems: this.getGroundItems(),
      inventories: Object.fromEntries(this.inventories.entries()),
    };
  }

  private assertWithinBounds(pos: Vec2, label: string): void {
    if (pos.x < 0 || pos.x > config.WORLD_WIDTH || pos.y < 0 || pos.y > config.WORLD_HEIGHT) {
      throw new Error(`${label} position out of bounds: (${pos.x}, ${pos.y})`);
    }
  }
}
