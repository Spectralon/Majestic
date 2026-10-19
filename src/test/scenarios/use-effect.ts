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

export const useEffect = {
  name: "use-effect",
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

    assert.strictEqual(player.hp, staticDataService.config.PLAYER.spawnHP);

    await inventoryService.give("p1", "medkit");
    await inventoryService.use("p1", "medkit");
    assert.strictEqual(player.hp, staticDataService.config.PLAYER.maxHP);
    assert.strictEqual(inventoryService.getInventory("p1").length, 0);
  },
};
