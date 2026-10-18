import type { IStorage } from "../storage/IStorage.js";
import type { GameLoopService } from "./GameLoopService.js";

export class InventoryService {
  constructor(
    private _gameLoop: GameLoopService,
    private _storage: IStorage,
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
