import type { WorldState } from "../core/world.js";
import type { ValidationService } from "../services/ValidationService.js";
import type { InventoryService } from "../services/InventoryService.js";
import type { WorldSnapshot } from "../types.js";

export class GameServer {
  constructor(
    private world: WorldState,
    private validationService: ValidationService,
    private inventoryService: InventoryService,
  ) {}

  async start(): Promise<void> {
  }

  stop(): void {
  }

  broadcast(snapshot: WorldSnapshot): void {
  }
}
