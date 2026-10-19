import type { IEffect, ITickable, PlayerData, Vec2 } from "../types.js";
import { validatePosition, validateAmount, validateStat } from "../utils/validation.js";
import { Inventory } from "./inventory.js";

export class Player implements ITickable {
  readonly id: string;

  private readonly _config: any;
  private _position: Vec2;
  private _target: Vec2 | null = null;
  private _hp: number;
  private _armor: number;
  private _effects: IEffect[] = [];
  private readonly _inventory: Inventory = new Inventory();

  constructor(id: string, position: Vec2, config: any) {
    if (!id) throw new Error("Player id must be non-empty");
    this.id = id;
    this._config = config;
    this._position = validatePosition(position, config.WORLD_WIDTH, config.WORLD_HEIGHT, "Player position");
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

  get effects(): readonly IEffect[] {
    return this._effects;
  }

  get inventory(): Inventory {
    return this._inventory;
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

  addEffect(effect: IEffect): void {
    if (!effect) throw new Error("addEffect: effect must be provided");
    const index = this._effects.findIndex((candidate) => candidate.type === effect.type);
    if (index === -1) {
      this._effects.push(effect);
    } else {
      this._effects[index] = effect;
    }
  }

  getEffect(type: string): IEffect | undefined {
    return this._effects.find((candidate) => candidate.type === type);
  }

  removeEffect(type: string): void {
    this._effects = this._effects.filter((effect) => effect.type !== type);
  }

  tick(): void {
    this.advanceEffects();
  }

  toData(): PlayerData {
    return {
      id: this.id,
      position: { ...this._position },
      target: this._target === null ? null : { ...this._target },
      hp: this._hp,
      armor: this._armor,
      effects: this._effects.map((effect) => effect.clone()),
    };
  }

  private advanceEffects(): void {
    this._effects = this._effects.filter((effect) => effect !== null && effect.remainingTicks >= 0);
  }
}
