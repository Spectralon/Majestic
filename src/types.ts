export interface Vec2 {
  x: number;
  y: number;
}

export interface PlayerStats {
  hp: number;
  armor: number;
}

export interface ActiveEffect {
  type: string;
  remainingTicks: number;
  data?: Record<string, number>;
}

export interface Player {
  id: string;
  position: Vec2;
  target: Vec2 | null;
  stats: PlayerStats;
  effects: ActiveEffect[];
}

export interface ItemInstance {
  id: string;
  type: string;
  amount: number;
}

export interface GroundItem {
  id: string;
  type: string;
  position: Vec2;
  expiresAtTick: number;
}

export interface WorldSnapshot {
  tick: number;
  players: Player[];
  groundItems: GroundItem[];
  inventories: Record<string, ItemInstance[]>;
}
