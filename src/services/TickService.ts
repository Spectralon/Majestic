import type { WorldState } from "../core/world.js";
import type { IStorage } from "../storage/IStorage.js";
import type { EffectService } from "./EffectService.js";
import type { WorldSnapshot } from "../types.js";

export class TickService {
  constructor(
    private world: WorldState,
    private effectService: EffectService,
    private storage: IStorage,
    private broadcast: (snapshot: WorldSnapshot) => void,
  ) {}

  start(): void {
  }

  stop(): void {
  }

  tick(): void {
  }
}
