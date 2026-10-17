import type { IItem } from "./IItem.js";

const items = new Map<string, IItem>();

export function registerItem(item: IItem): void {
  items.set(item.type, item);
}

export function getItem(type: string): IItem | undefined {
  return items.get(type);
}

export function getAllItems(): IItem[] {
  return Array.from(items.values());
}
