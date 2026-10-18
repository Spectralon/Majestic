import type { GameFactory } from "../services/GameFactory.js";
import type { ValidationService } from "../services/ValidationService.js";
import type { InventoryService } from "../services/InventoryService.js";
import type { GameLoopService } from "../services/GameLoopService.js";
import type { WorldSnapshot } from "../types.js";

export class GameServer {
  constructor(
    private _gameFactory: GameFactory,
    private _validationService: ValidationService,
    private _inventoryService: InventoryService,
    private _gameLoop: GameLoopService,
  ) {}

  async start(): Promise<void> {
  }

  stop(): void {
  }

  broadcast(snapshot: WorldSnapshot): void {
  }
}
