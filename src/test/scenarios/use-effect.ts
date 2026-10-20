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

export const useEffect = {
  name: "use-effect",
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

    assert.strictEqual(player.hp, staticDataService.config.PLAYER.spawnHP);

    await inventoryService.give("p1", "medkit");
    await inventoryService.use("p1", "medkit");
    assert.strictEqual(player.hp, staticDataService.config.PLAYER.maxHP);
    assert.strictEqual(inventoryService.getInventory("p1").length, 0);

    const player2 = factory.createPlayer("p2", { x: 200, y: 200 });
    world.addPlayer(player2);
    await inventoryService.give("p2", "bandage");
    await inventoryService.use("p2", "bandage");
    assert.strictEqual(player2.effects.length, 1);
    for (let i = 0; i < 5; i++) {
      gameLoop.tick();
    }
    const bandage = staticDataService.config.ITEMS.bandage;
    assert.strictEqual(player2.hp, staticDataService.config.PLAYER.spawnHP + bandage.healPerTick * (bandage.duration + 1));
    assert.strictEqual(player2.effects.length, 0);
  },
};
