import type { IStorage } from "./IStorage.js";
import type { IItemInstance, GroundItem } from "../types.js";

export class MemoryStorage implements IStorage {
  private _inventories = new Map<string, IItemInstance[]>();
  private _groundItems = new Map<string, GroundItem>();

  constructor(private _delayMs: number) {}

  async saveInventory(playerId: string, items: IItemInstance[]): Promise<void> {
    await this.delay();
    this._inventories.set(playerId, items);
  }

  async loadInventory(playerId: string): Promise<IItemInstance[] | null> {
    await this.delay();
    return this._inventories.get(playerId) ?? null;
  }

  async saveGroundItem(item: GroundItem): Promise<void> {
    await this.delay();
    this._groundItems.set(item.id, item);
  }

  async loadGroundItems(): Promise<GroundItem[]> {
    await this.delay();
    return Array.from(this._groundItems.values());
  }

  async deleteGroundItem(itemId: string): Promise<void> {
    await this.delay();
    this._groundItems.delete(itemId);
  }

  private delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this._delayMs));
  }
}
