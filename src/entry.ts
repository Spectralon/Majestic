import { config } from "./config.js";
import { WorldState } from "./core/world.js";
import { MemoryStorage } from "./storage/MemoryStorage.js";
import { EffectService } from "./services/EffectService.js";
import { InventoryService } from "./services/InventoryService.js";
import { ValidationService } from "./services/ValidationService.js";
import { TickService } from "./services/TickService.js";
import { GameServer } from "./server/GameServer.js";
import "./items/index.js";

async function main(): Promise<void> {
  console.log("[entry] Server starting...");

  const storage = new MemoryStorage();

  const world = new WorldState();

  const effectService = new EffectService(world);
  const inventoryService = new InventoryService(world, storage);
  const validationService = new ValidationService(world);
  const server = new GameServer(world, validationService, inventoryService);
  const tickService = new TickService(world, effectService, storage, (snapshot) =>
    server.broadcast(snapshot),
  );

  await server.start();
  tickService.start();

  console.log(
    `[entry] running: HTTP ${config.HTTP_PORT}, WS ${config.WS_PORT}, tick ${config.TICK_INTERVAL_MS}ms`,
  );
}

main().catch((err) => {
  console.error("[entry] fatal:", err);
  process.exit(1);
});
