import type {Player} from "../Player";

export interface IItem {
    readonly type: string;
    readonly stackable: boolean;

    onUse?(player: Player): void;
    onDrop?(player: Player): void;
}
