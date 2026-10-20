import type {IStorage} from "../infrastructure/storage/IStorage";
import type {GameLoopService} from "../infrastructure/services/GameLoopService";
import type {ItemRegistryService} from "../infrastructure/services/ItemRegistryService";
import type {GameFactory} from "../infrastructure/GameFactory";
import type {StaticDataService} from "../infrastructure/services/StaticDataService";
import type {Vec2} from "../objects/data";
import type {IItemInstance} from "../objects/abstract";
import {sqrDistance} from "../utils/distance";
import {World} from "../objects/World";

export class InventoryService {
    private readonly _storage: IStorage;
    private readonly _itemRegistry: ItemRegistryService;
    private readonly _gameFactory: GameFactory;
    private readonly _gameLoop: GameLoopService;

    private readonly _pickupRadiusSqr: number;

    constructor(
        gameLoop: GameLoopService,
        storage: IStorage,
        itemRegistry: ItemRegistryService,
        gameFactory: GameFactory,
        staticDataService: StaticDataService,
    ) {
        this._storage = storage;
        this._itemRegistry = itemRegistry;
        this._gameFactory = gameFactory;
        this._gameLoop = gameLoop;
        this._pickupRadiusSqr = staticDataService.config.PLAYER.pickupRadius ** 2;
    }

    getInventory(playerId: string): IItemInstance[] {
        const player = this._gameLoop.world.getPlayer(playerId);
        return [...player.inventory.items];
    }

    async give(playerId: string, type: string, amount: number = 1): Promise<void> {
        const player = this._gameLoop.world.getPlayer(playerId);

        if (!Number.isInteger(amount) || amount < 1)
            throw new Error("give: amount must be a positive integer");

        const instance = this._gameFactory.createItemInstance(type, amount);
        player.inventory.addItem(instance);
        await this._storage.saveInventory(playerId, [...player.inventory.items]);
    }

    async drop(playerId: string, type: string): Promise<void> {
        const instance = this.findInstanceOfType(playerId, type);
        await this.dropItemWithId(playerId, instance.id);
    }

    async dropItemWithId(playerId: string, itemId: string): Promise<void> {
        const player = this._gameLoop.world.getPlayer(playerId);
        const instance = this.findInstance(playerId, itemId);
        const item = this._itemRegistry.get(instance.type);

        player.inventory.removeItem(instance);
        await this._storage.saveInventory(playerId, [...player.inventory.items]);

        const groundItem = this._gameFactory.createGroundItem(instance.type, player.position);
        this._gameLoop.world.addGroundItem(groundItem);
        item.onDrop?.(player);
        await this._storage.saveGroundItem(groundItem);
    }

    async spawnItem(type: string, position: Vec2): Promise<void> {
        const groundItem = this._gameFactory.createGroundItem(type, position);
        this._gameLoop.world.addGroundItem(groundItem);
        await this._storage.saveGroundItem(groundItem);
    }

    async pickup(playerId: string, groundItemId: string): Promise<void> {
        const player = this._gameLoop.world.getPlayer(playerId);
        const groundItem = this._gameLoop.world.getGroundItemById(groundItemId);

        if (sqrDistance(player.position, groundItem.position) > this._pickupRadiusSqr)
            throw new Error("pickup: ground item out of range");

        this._gameLoop.world.removeGroundItem(groundItemId);
        await this._storage.deleteGroundItem(groundItemId);

        const instance = this._gameFactory.createItemInstance(groundItem.type, 1);
        player.inventory.addItem(instance);
        await this._storage.saveInventory(playerId, [...player.inventory.items]);
    }

    async use(playerId: string, type: string): Promise<void> {
        const instance = this.findInstanceOfType(playerId, type);
        await this.useItemWithId(playerId, instance.id);
    }

    async useItemWithId(playerId: string, itemId: string): Promise<void> {
        const player = this._gameLoop.world.getPlayer(playerId);
        const instance = this.findInstance(playerId, itemId);
        const item = this._itemRegistry.get(instance.type);

        const effect = this._gameFactory.tryCreateEffect(instance.type);
        if (effect)
            player.addEffect(effect);
        else if (item.onUse)
            item.onUse(player);

        player.inventory.removeItem(instance);
        await this._storage.saveInventory(playerId, [...player.inventory.items]);
    }

    async loadInventory(playerId: string): Promise<void> {
        const player = this._gameLoop.world.getPlayer(playerId);

        const items = await this._storage.loadInventory(playerId);
        if (!items) return;
        player.inventory.load(items);
    }

    private findInstance(playerId: string, itemId: string): IItemInstance {
        const player = this._gameLoop.world.getPlayer(playerId);
        const instance = player.inventory.items.find((candidate) => candidate.id === itemId);
        if (!instance)
            throw new Error(`Item not found in inventory: ${itemId}`);
        return instance;
    }

    private findInstanceOfType(playerId: string, type: string): IItemInstance {
        const player = this._gameLoop.world.getPlayer(playerId);
        const instance = player.inventory.items.find((candidate) => candidate.type === type);
        if (!instance)
            throw new Error(`Item not found in inventory: ${type}`);
        return instance;
    }
}
