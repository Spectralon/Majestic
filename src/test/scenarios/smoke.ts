import assert from "node:assert";
import { config } from "../../config.js";
import { WorldState } from "../../core/world.js";
import { getItem } from "../../items/registry.js";
import "../../items/index.js";

export const smoke = {
  name: "smoke",
  async run(): Promise<void> {
    const world = new WorldState();
    const player = world.addPlayer("p1", { x: 100, y: 100 });

    assert.strictEqual(player.hp, config.PLAYER.spawnHP);
    assert.strictEqual(player.armor, config.PLAYER.spawnArmor);

    const medkit = getItem("medkit");
    if (medkit === undefined || medkit.onUse === undefined) {
      throw new Error("medkit is not registered");
    }

    medkit.onUse(player, world);
    assert.strictEqual(player.hp, config.PLAYER.maxHP);

    world.advanceTick();

    assert.strictEqual(world.tick, 1);
    assert.strictEqual(world.getSnapshot().players.length, 1);
  },
};
