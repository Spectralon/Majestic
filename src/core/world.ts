import type { Player, GroundItem, ItemInstance, WorldSnapshot } from "../types.js";

export class WorldState {
  tick: number = 0;
  players: Map<string, Player> = new Map();
  groundItems: Map<string, GroundItem> = new Map();
  inventories: Map<string, ItemInstance[]> = new Map();

  addPlayer(player: Player): void {
    this.players.set(player.id, player);
    this.inventories.set(player.id, []);
  }

  removePlayer(playerId: string): void {
    this.players.delete(playerId);
    this.inventories.delete(playerId);
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  addGroundItem(item: GroundItem): void {
    this.groundItems.set(item.id, item);
  }

  removeGroundItem(itemId: string): void {
    this.groundItems.delete(itemId);
  }

  getGroundItems(): GroundItem[] {
    return Array.from(this.groundItems.values());
  }

  getInventory(playerId: string): ItemInstance[] {
    return this.inventories.get(playerId) ?? [];
  }

  setInventory(playerId: string, items: ItemInstance[]): void {
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
}
