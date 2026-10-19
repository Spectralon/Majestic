export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export interface ITickable {
  tick(): boolean;
}

export interface IEffect extends ITickable {
  readonly type: string;
  readonly remainingTicks: number;
  readonly data?: Record<string, number>;
  clone(): IEffect;
}

export interface PlayerData {
  readonly id: string;
  readonly position: Vec2;
  readonly target: Vec2 | null;
  readonly hp: number;
  readonly armor: number;
  readonly effects: IEffect[];
}

export interface ItemInstance {
  readonly id: string;
  readonly type: string;
  readonly amount: number;
}

export interface GroundItem {
  readonly id: string;
  readonly type: string;
  readonly position: Vec2;
  readonly expiresAtTick: number;
}

export interface WorldSnapshot {
  readonly tick: number;
  readonly players: PlayerData[];
  readonly groundItems: GroundItem[];
  readonly inventories: Record<string, ItemInstance[]>;
}
