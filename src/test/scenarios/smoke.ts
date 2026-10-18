import assert from "node:assert";
import { StaticDataService } from "../../services/StaticDataService.js";
import { ItemRegistryService } from "../../services/ItemRegistryService.js";
import { GameFactory } from "../../services/GameFactory.js";

export const smoke = {
  name: "smoke",
  async run(): Promise<void> {
    const staticDataService = new StaticDataService();
    const itemRegistry = new ItemRegistryService();
    const factory = new GameFactory(staticDataService, itemRegistry);
    const world = factory.createGameWorld();
    factory.createAllItems();

    const player = factory.createPlayer("p1", { x: 100, y: 100 });

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
