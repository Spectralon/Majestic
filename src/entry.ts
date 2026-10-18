import { MemoryStorage } from "./storage/MemoryStorage.js";
import { StaticDataService } from "./services/StaticDataService.js";
import { ItemRegistryService } from "./services/ItemRegistryService.js";
import { GameFactory } from "./services/GameFactory.js";
import { EffectService } from "./services/EffectService.js";
import { InventoryService } from "./services/InventoryService.js";
import { ValidationService } from "./services/ValidationService.js";
import { TickService } from "./services/TickService.js";
import { GameServer } from "./server/GameServer.js";

async function main(): Promise<void> {
  console.log("[entry] Server starting...");

  const staticDataService = new StaticDataService();
  const storage = new MemoryStorage(staticDataService.config.STORAGE_DELAY_MS);
  const itemRegistry = new ItemRegistryService();
  const gameFactory = new GameFactory(staticDataService, itemRegistry);
  const world = gameFactory.createGameWorld();
  gameFactory.createAllItems();

  const effectService = new EffectService(world);
  const inventoryService = new InventoryService(world, storage);
  const validationService = new ValidationService(world);
  const server = new GameServer(validationService, inventoryService, world);
  const tickService = new TickService(world, effectService, storage, (snapshot) =>
    server.broadcast(snapshot),
  );

  await server.start();
  tickService.start();

  console.log(
    `[entry] running: HTTP ${staticDataService.config.HTTP_PORT}, WS ${staticDataService.config.WS_PORT}, tick ${staticDataService.config.TICK_INTERVAL_MS}ms`,
  );
}

main().catch((err) => {
  console.error("[entry] fatal:", err);
  process.exit(1);
});
