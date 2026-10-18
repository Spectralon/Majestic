import type { IItem } from "../items/IItem.js";

export class ItemRegistryService {
  private _items = new Map<string, IItem>();

  register(item: IItem): void {
    this._items.set(item.type, item);
  }

  get(type: string): IItem | undefined {
    return this._items.get(type);
  }

  getAll(): IItem[] {
    return Array.from(this._items.values());
  }
}
