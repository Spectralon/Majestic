import type { ItemInstance, GroundItem } from "../types.js";

export interface IStorage {
  saveInventory(playerId: string, items: ItemInstance[]): Promise<void>;
  loadInventory(playerId: string): Promise<ItemInstance[] | null>;
  saveGroundItem(item: GroundItem): Promise<void>;
  loadGroundItems(): Promise<GroundItem[]>;
  deleteGroundItem(itemId: string): Promise<void>;
}
