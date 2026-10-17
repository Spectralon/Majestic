import assert from "node:assert";
import { config } from "../../config.js";
import { WorldState } from "../../core/world.js";

export const smoke = {
  name: "smoke",
  async run(): Promise<void> {
    const world = new WorldState();

    world.addPlayer({
      id: "p1",
      position: { x: 100, y: 100 },
      target: null,
      stats: { hp: config.PLAYER.spawnHP, armor: config.PLAYER.spawnArmor },
      effects: [],
    });

    world.advanceTick();

    assert.strictEqual(world.tick, 1);
    assert.strictEqual(world.getSnapshot().players.length, 1);
  },
};
