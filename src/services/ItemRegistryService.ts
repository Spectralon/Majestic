import type { IItem } from "../items/IItem.js";

export class ItemRegistryService {
  private items = new Map<string, IItem>();

  register(item: IItem): void {
    this.items.set(item.type, item);
  }

  get(type: string): IItem | undefined {
    return this.items.get(type);
  }

  getAll(): IItem[] {
    return Array.from(this.items.values());
  }
}
