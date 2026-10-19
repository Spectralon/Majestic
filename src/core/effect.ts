import type { IEffect } from "../types.js";

export class ActiveEffect implements IEffect {
  readonly type: string;
  readonly data?: Record<string, number>;
  private _remainingTicks: number;

  constructor(type: string, remainingTicks: number, data?: Record<string, number>) {
    if (!type)
      throw new Error("ActiveEffect: type must be non-empty");
    if (!Number.isInteger(remainingTicks) || remainingTicks < 0)
      throw new Error("ActiveEffect: remainingTicks must be a non-negative integer");
    this.type = type;
    this._remainingTicks = remainingTicks;
    this.data =
        data === undefined
            ? undefined
            : { ...data };
  }

  get remainingTicks(): number {
    return this._remainingTicks;
  }

  tick(): void {
    this._remainingTicks--;
  }

  clone(): IEffect {
    return new ActiveEffect(
      this.type,
      this._remainingTicks,
      this.data === undefined ? undefined : { ...this.data },
    );
  }
}
