import type { ActiveEffect, PlayerData, Vec2 } from "../types.js";
import { validatePosition, validateAmount, validateStat } from "../utils/validation.js";

export class Player {
  readonly id: string;
  private readonly _config: any;
  private _position: Vec2;
  private _target: Vec2 | null = null;
  private _hp: number;
  private _armor: number;
  private _effects: ActiveEffect[] = [];

  constructor(id: string, position: Vec2, config: any) {
    if (!id) throw new Error("Player id must be non-empty");
    this.id = id;
    this._config = config;
    this._position = validatePosition(position, config.WORLD_WIDTH, config.WORLD_HEIGHT, "position");
    this._hp = validateStat(config.PLAYER.spawnHP, "spawnHP");
    this._armor = validateStat(config.PLAYER.spawnArmor, "spawnArmor");
  }

  get position(): Vec2 {
    return { ...this._position };
  }

  get target(): Vec2 | null {
    return this._target === null ? null : { ...this._target };
  }

  get hp(): number {
    return this._hp;
  }

  get armor(): number {
    return this._armor;
  }

  get effects(): readonly ActiveEffect[] {
    return this._effects.map((effect) => ({ ...effect }));
  }

  addHP(amount: number): void {
    this._hp = Math.min(this._config.PLAYER.maxHP, this._hp + validateAmount(amount, "addHP"));
  }

  addArmor(amount: number): void {
    this._armor = Math.min(this._config.PLAYER.maxArmor, this._armor + validateAmount(amount, "addArmor"));
  }

  setTarget(target: Vec2 | null): void {
    this._target =
      target === null
        ? null
        : validatePosition(target, this._config.WORLD_WIDTH, this._config.WORLD_HEIGHT, "target");
  }

  moveBy(delta: Vec2): void {
    if (!Number.isFinite(delta.x) || !Number.isFinite(delta.y)) {
      throw new Error("moveBy: delta must be finite");
    }
    this._position = {
      x: Math.min(this._config.WORLD_WIDTH, Math.max(0, this._position.x + delta.x)),
      y: Math.min(this._config.WORLD_HEIGHT, Math.max(0, this._position.y + delta.y)),
    };
  }

  addEffect(type: string, remainingTicks: number, data?: Record<string, number>): void {
    if (!type) throw new Error("addEffect: type must be non-empty");
    if (this._effects.some((effect) => effect.type === type)) {
      throw new Error(`addEffect: effect already active: ${type}`);
    }
    if (!Number.isInteger(remainingTicks) || remainingTicks <= 0) {
      throw new Error("addEffect: remainingTicks must be a positive integer");
    }
    const effect: ActiveEffect = { type, remainingTicks };
    if (data !== undefined) {
      effect.data = { ...data };
    }
    this._effects.push(effect);
  }

  getEffect(type: string): ActiveEffect | undefined {
    const effect = this._effects.find((candidate) => candidate.type === type);
    return effect === undefined ? undefined : { ...effect };
  }

  removeEffect(type: string): void {
    this._effects = this._effects.filter((effect) => effect.type !== type);
  }

  advanceEffects(): void {
    this._effects = this._effects
      .map((effect) => ({ ...effect, remainingTicks: effect.remainingTicks - 1 }))
      .filter((effect) => effect.remainingTicks > 0);
  }

  toData(): PlayerData {
    return {
      id: this.id,
      position: { ...this._position },
      target: this._target === null ? null : { ...this._target },
      hp: this._hp,
      armor: this._armor,
      effects: this._effects.map((effect) => ({ ...effect })),
    };
  }
}
