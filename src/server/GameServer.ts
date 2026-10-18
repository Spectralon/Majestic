import type { WorldState } from "../core/world.js";
import type { ValidationService } from "../services/ValidationService.js";
import type { InventoryService } from "../services/InventoryService.js";
import type { WorldSnapshot } from "../types.js";

export class GameServer {
  constructor(
    private validationService: ValidationService,
    private inventoryService: InventoryService,
    private world: WorldState,
  ) {}

  async start(): Promise<void> {
  }

  stop(): void {
  }

  broadcast(snapshot: WorldSnapshot): void {
  }
}
