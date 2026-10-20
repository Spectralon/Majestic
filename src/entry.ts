import {MemoryStorage} from "./infrastructure/storage/MemoryStorage.js";
import {StaticDataService} from "./infrastructure/services/StaticDataService";
import {ItemRegistryService} from "./infrastructure/services/ItemRegistryService";
import {GameFactory} from "./infrastructure/GameFactory";
import {EffectService} from "./services/EffectService";
import {GroundItemService} from "./services/GroundItemService";
import {FlareService} from "./services/FlareService";
import {InventoryService} from "./services/InventoryService";
import {ValidationService} from "./infrastructure/services/ValidationService";
import {GameLoopService} from "./infrastructure/services/GameLoopService";
import {DemoService} from "./infrastructure/services/DemoService";
import {GameServer} from "./infrastructure/GameServer";
import {World} from "./objects/World.js";

async function main(): Promise<void> {
    console.log("[entry] Server starting...");

    const staticDataService: StaticDataService = new StaticDataService();
    const storage: MemoryStorage = new MemoryStorage(staticDataService);
    const itemRegistry: ItemRegistryService = new ItemRegistryService();
    const gameLoop: GameLoopService = new GameLoopService(staticDataService);
    const effectService: EffectService = new EffectService(gameLoop, itemRegistry);
    const flareService: FlareService = new FlareService(gameLoop, staticDataService);
    const gameFactory: GameFactory = new GameFactory(staticDataService, itemRegistry, gameLoop, flareService);
    const world: World = gameFactory.createGameWorld();
    const groundItemService: GroundItemService = new GroundItemService(gameLoop, storage);
    const validationService: ValidationService = new ValidationService(gameLoop, itemRegistry, staticDataService);
    const inventoryService: InventoryService = new InventoryService(gameLoop, storage, itemRegistry, gameFactory, staticDataService);
    const demoService: DemoService = new DemoService(gameLoop, gameFactory, inventoryService, staticDataService);
    const server: GameServer = new GameServer(gameFactory, validationService, inventoryService, gameLoop, staticDataService, demoService);

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
