import {Vec2} from "./data";

export declare class GroundItem {
    readonly id: string;
    readonly type: string;
    readonly position: Vec2;
    readonly expiresAtTick: number;
}