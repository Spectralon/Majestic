import { MemoryStorage } from "./storage/MemoryStorage.js";
import { StaticDataService } from "./services/StaticDataService.js";
import { ItemRegistryService } from "./services/ItemRegistryService.js";
import { GameFactory } from "./services/GameFactory.js";
import { EffectService } from "./services/EffectService.js";
import { InventoryService } from "./services/InventoryService.js";
import { ValidationService } from "./services/ValidationService.js";
import { GameLoopService } from "./services/GameLoopService.js";
import { GameServer } from "./server/GameServer.js";

async function main(): Promise<void> {
  console.log("[entry] Server starting...");

  const staticDataService = new StaticDataService();
  const storage = new MemoryStorage(staticDataService.config.STORAGE_DELAY_MS);
  const itemRegistry = new ItemRegistryService();
  const effectService = new EffectService();
  const gameLoop = new GameLoopService(effectService, storage, (snapshot) =>
    server.broadcast(snapshot),
  );
  const gameFactory = new GameFactory(staticDataService, itemRegistry, gameLoop);
  gameFactory.createAllItems();
  const world = gameFactory.createGameWorld();
  gameLoop.initialize(world);
  const validationService = new ValidationService(gameLoop);
  const inventoryService = new InventoryService(gameLoop, storage);
  const server = new GameServer(gameFactory, validationService, inventoryService, gameLoop);

  await server.start();
  gameLoop.start();

  console.log(
    `[entry] running: HTTP ${staticDataService.config.HTTP_PORT}, WS ${staticDataService.config.WS_PORT}, tick ${staticDataService.config.TICK_INTERVAL_MS}ms`,
  );
}

main().catch((err) => {
  console.error("[entry] fatal:", err);
  process.exit(1);
});
