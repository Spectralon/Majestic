import type { GameLoopService } from "./GameLoopService.js";

export type ValidationResult = { ok: true } | { ok: false; reason: string };

export class ValidationService {
  constructor(private gameLoop: GameLoopService) {}

  validateMove(playerId: string, x: number, y: number): ValidationResult {
    throw new Error("Not implemented");
  }

  validatePickup(playerId: string, groundItemId: string): ValidationResult {
    throw new Error("Not implemented");
  }

  validateUse(playerId: string, instanceId: string): ValidationResult {
    throw new Error("Not implemented");
  }

  validateDrop(playerId: string, instanceId: string): ValidationResult {
    throw new Error("Not implemented");
  }
}
