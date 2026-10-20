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

export const groundTimeout = {
  name: "ground-timeout",
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

    const player = factory.createPlayer("p1", { x: 100, y: 100 });
    world.addPlayer(player);

    await inventoryService.give("p1", "medkit");
    await inventoryService.drop("p1", "medkit");
    assert.strictEqual(world.getGroundItems().length, 1);

    const lifetime = staticDataService.config.GROUND_LIFETIME_TICKS;
    for (let i = 0; i < lifetime; i++) {
      world.advanceTick();
    }
    gameLoop.tick();

    assert.strictEqual(world.getGroundItems().length, 0);
  },
};
