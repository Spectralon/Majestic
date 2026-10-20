import type {IItemInstance, GroundItem} from "../types.js";

export interface IStorage {
    saveInventory(playerId: string, items: IItemInstance[]): Promise<void>;

    loadInventory(playerId: string): Promise<IItemInstance[] | null>;

    saveGroundItem(item: GroundItem): Promise<void>;

    loadGroundItems(): Promise<GroundItem[]>;

    deleteGroundItem(itemId: string): Promise<void>;
}
