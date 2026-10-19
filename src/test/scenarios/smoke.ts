import assert from "node:assert";
import { StaticDataService } from "../../services/StaticDataService.js";
import { ItemRegistryService } from "../../services/ItemRegistryService.js";
import { GameFactory } from "../../services/GameFactory.js";
import { EffectService } from "../../services/EffectService.js";
import { GameLoopService } from "../../services/GameLoopService.js";
import { MemoryStorage } from "../../storage/MemoryStorage.js";

export const smoke = {
  name: "smoke",
  async run(): Promise<void> {
    const staticDataService = new StaticDataService();
    const itemRegistry = new ItemRegistryService();
    const storage = new MemoryStorage(staticDataService.config.STORAGE_DELAY_MS);
    const gameLoop = new GameLoopService(storage, () => {});
    const effectService = new EffectService(gameLoop, itemRegistry);
    const factory = new GameFactory(staticDataService, itemRegistry, gameLoop);
    factory.createAllItems();
    const world = factory.createGameWorld();
    gameLoop.initialize(world);
    effectService.initialize();

    const player = factory.createPlayer("p1", { x: 100, y: 100 });
    world.addPlayer(player);

    assert.strictEqual(player.hp, staticDataService.config.PLAYER.spawnHP);
    assert.strictEqual(player.armor, staticDataService.config.PLAYER.spawnArmor);

    const medkit = itemRegistry.get("medkit");
    if (medkit === undefined || medkit.onUse === undefined) {
      throw new Error("medkit is not registered");
    }

    medkit.onUse(player, world);
    assert.strictEqual(player.hp, staticDataService.config.PLAYER.maxHP);

    world.advanceTick();

    assert.strictEqual(world.tick, 1);
    assert.strictEqual(world.getSnapshot().players.length, 1);
  },
};
