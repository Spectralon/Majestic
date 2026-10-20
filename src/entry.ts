import { MemoryStorage } from "./storage/MemoryStorage.js";
import { StaticDataService } from "./services/StaticDataService.js";
import { ItemRegistryService } from "./services/ItemRegistryService.js";
import { GameFactory } from "./services/GameFactory.js";
import { EffectService } from "./services/EffectService.js";
import { GroundItemService } from "./services/GroundItemService.js";
import { FlareService } from "./services/FlareService.js";
import { InventoryService } from "./services/InventoryService.js";
import { ValidationService } from "./services/ValidationService.js";
import { GameLoopService } from "./services/GameLoopService.js";
import { DemoService } from "./services/DemoService.js";
import { GameServer } from "./server/GameServer.js";

async function main(): Promise<void> {
  console.log("[entry] Server starting...");

  const staticDataService = new StaticDataService();
  const storage = new MemoryStorage(staticDataService.config.STORAGE_DELAY_MS);
  const itemRegistry = new ItemRegistryService();
  const gameLoop = new GameLoopService(
    staticDataService.config.TICK_INTERVAL_MS,
    (snapshot) => server.broadcast(snapshot),
  );
  const effectService = new EffectService(gameLoop, itemRegistry);
  const flareService = new FlareService(gameLoop, staticDataService);
  const gameFactory = new GameFactory(staticDataService, itemRegistry, gameLoop, flareService);
  flareService.initialize(gameFactory);
  gameFactory.createAllItems();
  const world = gameFactory.createGameWorld();
  gameLoop.initialize(world);
  effectService.initialize();
  const groundItemService = new GroundItemService(gameLoop, storage);
  groundItemService.initialize();
  const validationService = new ValidationService(gameLoop, itemRegistry, staticDataService);
  const inventoryService = new InventoryService(gameLoop, storage, itemRegistry, gameFactory, staticDataService);
  const demoService = new DemoService(gameLoop, gameFactory, inventoryService, staticDataService);
  const server = new GameServer(gameFactory, validationService, inventoryService, gameLoop, staticDataService, demoService);

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
