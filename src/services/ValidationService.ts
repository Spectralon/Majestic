import type { WorldState } from "../core/world.js";

export type ValidationResult = { ok: true } | { ok: false; reason: string };

export class ValidationService {
  constructor(private world: WorldState) {}

  validateMove(playerId: string, x: number, y: number): ValidationResult {
    throw new Error("Not implemented: Stage 14");
  }

  validatePickup(playerId: string, groundItemId: string): ValidationResult {
    throw new Error("Not implemented: Stage 14");
  }

  validateUse(playerId: string, instanceId: string): ValidationResult {
    throw new Error("Not implemented: Stage 14");
  }

  validateDrop(playerId: string, instanceId: string): ValidationResult {
    throw new Error("Not implemented: Stage 14");
  }
}
