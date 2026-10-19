import assert from "node:assert";
import { StaticDataService } from "../../services/StaticDataService.js";
import { ItemRegistryService } from "../../services/ItemRegistryService.js";
import { GameFactory } from "../../services/GameFactory.js";
import { FlareService } from "../../services/FlareService.js";
import { EffectService } from "../../services/EffectService.js";
import { GroundItemService } from "../../services/GroundItemService.js";
import { InventoryService } from "../../services/InventoryService.js";
import { GameLoopService } from "../../services/GameLoopService.js";
import { MemoryStorage } from "../../storage/MemoryStorage.js";

export const concurrentPickup = {
  name: "concurrent-pickup",
  async run(): Promise<void> {
    const staticDataService = new StaticDataService();
    const itemRegistry = new ItemRegistryService();
    const storage = new MemoryStorage(0);
    const gameLoop = new GameLoopService(staticDataService.config.TICK_INTERVAL_MS, () => {});
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

    const playerA = factory.createPlayer("p1", { x: 100, y: 100 });
    const playerB = factory.createPlayer("p2", { x: 110, y: 100 });
    world.addPlayer(playerA);
    world.addPlayer(playerB);

    await inventoryService.give("p1", "medkit");
    await inventoryService.drop("p1", "medkit");
    const groundItems = world.getGroundItems();
    assert.strictEqual(groundItems.length, 1);
    const groundItemId = groundItems[0].id;

    await inventoryService.pickup("p1", groundItemId);
    assert.strictEqual(inventoryService.getInventory("p1").length, 1);
    assert.strictEqual(world.getGroundItems().length, 0);

    await assert.rejects(
      () => inventoryService.pickup("p2", groundItemId),
      /Ground item not found/,
    );
    assert.strictEqual(inventoryService.getInventory("p2").length, 0);
  },
};
