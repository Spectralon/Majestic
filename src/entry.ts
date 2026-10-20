import { MemoryStorage } from "./infrastructure/storage/MemoryStorage.js";
import { StaticDataService } from "./infrastructure/services/StaticDataService";
import { ItemRegistryService } from "./infrastructure/services/ItemRegistryService";
import { GameFactory } from "./infrastructure/GameFactory";
import { EffectService } from "./services/EffectService";
import { GroundItemService } from "./services/GroundItemService";
import { FlareService } from "./services/FlareService";
import { InventoryService } from "./services/InventoryService";
import { ValidationService } from "./infrastructure/services/ValidationService";
import { GameLoopService } from "./infrastructure/services/GameLoopService";
import { DemoService } from "./infrastructure/services/DemoService";
import { GameServer } from "./infrastructure/GameServer";

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
  const world = gameFactory.createGameWorld();
  const groundItemService = new GroundItemService(gameLoop, storage);
  const validationService = new ValidationService(gameLoop, itemRegistry, staticDataService);
  const inventoryService = new InventoryService(gameLoop, storage, itemRegistry, gameFactory, staticDataService);
  const demoService = new DemoService(gameLoop, gameFactory, inventoryService, staticDataService);
  const server = new GameServer(gameFactory, validationService, inventoryService, gameLoop, staticDataService, demoService);

  gameFactory.createAllItems();
  flareService.initialize(gameFactory);
  gameLoop.initialize(world);
  effectService.initialize();
  groundItemService.initialize();

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
