import type {IItemInstance} from "../../objects/abstract";
import { GroundItem } from "../../objects/GroundItem";

export interface IStorage {
    saveInventory(playerId: string, items: IItemInstance[]): Promise<void>;

    loadInventory(playerId: string): Promise<IItemInstance[] | null>;

    saveGroundItem(item: GroundItem): Promise<void>;

    loadGroundItems(): Promise<GroundItem[]>;

    deleteGroundItem(itemId: string): Promise<void>;
}
