import type { IItem } from "../items/IItem.js";

export class ItemRegistryService {
  private _items = new Map<string, IItem>();

  register(item: IItem): void {
    this._items.set(item.type, item);
  }

  get(type: string): IItem {
    const item = this._items.get(type);
    if (!item)
      throw new Error(`Unknown item type: ${type}`);
    return item;
  }

  getAll(): IItem[] {
    return Array.from(this._items.values());
  }
}
