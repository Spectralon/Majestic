import type { IItem } from "../items/IItem.js";
import type { ItemInstance } from "../types.js";

export class Inventory {
  private _items: ItemInstance[] = [];
  private _counter: number = 0;

  get items(): readonly ItemInstance[] {
    return this._items;
  }

  addItem(item: IItem, amount: number = 1): ItemInstance {
    if (item.stackable) {
      const idx = this._items.findIndex((i) => i.type === item.type);
      if (idx !== -1) {
        const updated: ItemInstance = { ...this._items[idx], amount: this._items[idx].amount + amount };
        this._items = [...this._items.slice(0, idx), updated, ...this._items.slice(idx + 1)];
        return updated;
      }
    }
    this._counter++;
    const instance: ItemInstance = { id: `inst_${this._counter}`, type: item.type, amount: item.stackable ? amount : 1 };
    this._items = [...this._items, instance];
    return instance;
  }

  removeItem(item: IItem): ItemInstance {
    const idx = this._items.findIndex((i) => i.type === item.type);
    if (idx === -1) throw new Error(`Item not found in inventory: ${item.type}`);
    const existing = this._items[idx];
    if (existing.amount > 1) {
      const updated: ItemInstance = { ...existing, amount: existing.amount - 1 };
      this._items = [...this._items.slice(0, idx), updated, ...this._items.slice(idx + 1)];
      return updated;
    }
    this._items = this._items.filter((i) => i.type !== item.type);
    return existing;
  }

  load(items: ItemInstance[]): void {
    this._items = [...items];
    this._counter = items.reduce((max, i) => {
      const num = parseInt(i.id.replace("inst_", ""), 10);
      return Number.isNaN(num) ? max : Math.max(max, num);
    }, 0);
  }

  hasItemOfType(type: string): boolean {
    return this._items.some((i) => i.type === type);
  }
}
