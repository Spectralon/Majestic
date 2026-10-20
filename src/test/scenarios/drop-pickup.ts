import assert from "node:assert";
import { StaticDataService } from "../../infrastructure/services/StaticDataService";
import { ItemRegistryService } from "../../infrastructure/services/ItemRegistryService";
import { GameFactory } from "../../infrastructure/GameFactory";
import { FlareService } from "../../services/FlareService.js";
import { EffectService } from "../../services/EffectService.js";
import { GroundItemService } from "../../services/GroundItemService.js";
import { InventoryService } from "../../services/InventoryService.js";
import { GameLoopService } from "../../infrastructure/services/GameLoopService";
import { MemoryStorage } from "../../infrastructure/storage/MemoryStorage.js";

export const dropPickup = {
  name: "drop-pickup",
  async run(): Promise<void> {
    const staticDataService = new StaticDataService();
    const itemRegistry = new ItemRegistryService();
    const storage = new MemoryStorage(staticDataService);
    const gameLoop = new GameLoopService(staticDataService);
    const flareService = new FlareService(gameLoop, staticDataService);
    const factory = new GameFactory(staticDataService, itemRegistry, gameLoop, flareService);
    flareService.initialize(factory);
    factory.createAllItems();
    const world = factory.createGameWorld();
    gameLoop.initialize(world);
    const effectService = new EffectService(gameLoop, itemRegistry);
    effectService.initialize();
    const groundItemService = new GroundItemService(gameLoop, storage);
    groundItemService.initialize();
    const inventoryService = new InventoryService(gameLoop, storage, itemRegistry, factory, staticDataService);

    const player = factory.createPlayer("p1", { x: 100, y: 100 });
    world.addPlayer(player);

    await inventoryService.give("p1", "medkit");
    assert.strictEqual(inventoryService.getInventory("p1").length, 1);

    await inventoryService.drop("p1", "medkit");
    assert.strictEqual(inventoryService.getInventory("p1").length, 0);
    const groundItems = world.getGroundItems();
    assert.strictEqual(groundItems.length, 1);
    assert.strictEqual(groundItems[0].type, "medkit");
    assert.strictEqual(groundItems[0].position.x, 100);
    assert.strictEqual(groundItems[0].position.y, 100);

    await inventoryService.pickup("p1", groundItems[0].id);
    assert.strictEqual(inventoryService.getInventory("p1").length, 1);
    assert.strictEqual(world.getGroundItems().length, 0);
  },
};
