import {IItemInstance} from "./abstract";
import {GroundItem} from "./GroundItem";

export declare class Vec2 {
    readonly x: number;
    readonly y: number;
}

export declare class EffectData {
    readonly type: string;
    readonly remainingTicks: number;
    readonly data?: Record<string, number>;
}

export declare class PlayerData {
    readonly id: string;
    readonly position: Vec2;
    readonly target: Vec2 | null;
    readonly hp: number;
    readonly armor: number;
    readonly effects: EffectData[];
}

export declare class WorldSnapshot {
    readonly tick: number;
    readonly players: PlayerData[];
    readonly groundItems: GroundItem[];
    readonly inventories: Record<string, IItemInstance[]>;
}
