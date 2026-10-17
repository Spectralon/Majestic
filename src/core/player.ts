import type { ActiveEffect, PlayerData, Vec2 } from "../types.js";
import { config } from "../config.js";

export class Player {
  readonly id: string;
  private _position: Vec2;
  private _target: Vec2 | null = null;
  private _hp: number;
  private _armor: number;
  private _effects: ActiveEffect[] = [];

  constructor(id: string, position: Vec2) {
    if (!id) throw new Error("Player id must be non-empty");
    this.id = id;
    this._position = Player.validPosition(position, "position");
    this._hp = Player.validStat(config.PLAYER.spawnHP, "spawnHP");
    this._armor = Player.validStat(config.PLAYER.spawnArmor, "spawnArmor");
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
    this._hp = Math.min(config.PLAYER.maxHP, this._hp + Player.validAmount(amount, "addHP"));
  }

  addArmor(amount: number): void {
    this._armor = Math.min(config.PLAYER.maxArmor, this._armor + Player.validAmount(amount, "addArmor"));
  }

  setTarget(target: Vec2 | null): void {
    this._target = target === null ? null : Player.validPosition(target, "target");
  }

  moveBy(delta: Vec2): void {
    if (!Number.isFinite(delta.x) || !Number.isFinite(delta.y)) {
      throw new Error("moveBy: delta must be finite");
    }
    this._position = {
      x: Math.min(config.WORLD_WIDTH, Math.max(0, this._position.x + delta.x)),
      y: Math.min(config.WORLD_HEIGHT, Math.max(0, this._position.y + delta.y)),
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

  private static validPosition(position: Vec2, label: string): Vec2 {
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
      throw new Error(`${label} must be a finite vector`);
    }
    if (
      position.x < 0 ||
      position.x > config.WORLD_WIDTH ||
      position.y < 0 ||
      position.y > config.WORLD_HEIGHT
    ) {
      throw new Error(`${label} out of bounds: (${position.x}, ${position.y})`);
    }
    return { ...position };
  }

  private static validAmount(amount: number, operation: string): number {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(`${operation}: amount must be a positive finite number`);
    }
    return amount;
  }

  private static validStat(value: number, name: string): number {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${name} must be a non-negative finite number`);
    }
    return value;
  }
}
