export interface ITickable {
    tick(): boolean;
}

export interface IEffect {
    readonly type: string;
    readonly remainingTicks: number;
    readonly data?: Record<string, number>;
}

export interface IItemInstance {
    readonly id: string;
    readonly type: string;
    readonly amount: number;
    readonly stackable: boolean;
}