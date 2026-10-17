import type { WorldState } from "../core/world.js";
import type { IStorage } from "../storage/IStorage.js";

export class InventoryService {
  constructor(
    private world: WorldState,
    private storage: IStorage,
  ) {}

  async give(playerId: string, type: string): Promise<void> {
  }

  async drop(playerId: string, instanceId: string): Promise<void> {
  }

  async pickup(playerId: string, groundItemId: string): Promise<void> {
  }

  async use(playerId: string, instanceId: string): Promise<void> {
  }

  async loadInventory(playerId: string): Promise<void> {
  }
}
