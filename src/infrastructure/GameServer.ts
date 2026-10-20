import {createServer, type Server, type IncomingMessage, type ServerResponse} from "node:http";
import {readFile} from "node:fs/promises";
import {join, extname, normalize} from "node:path";
import {WebSocketServer, WebSocket} from "ws";
import type {GameFactory} from "./GameFactory";
import type {ValidationService} from "./services/ValidationService";
import type {InventoryService} from "../services/InventoryService";
import type {GameLoopService} from "./services/GameLoopService";
import type {DemoService} from "./services/DemoService";
import type {WorldSnapshot} from "../objects/data";
import {StaticDataService} from "./services/StaticDataService";
import { IItemInstance } from "../objects/abstract";

const MIME_TYPES: Record<string, string> = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
};

export class GameServer {
    private readonly _httpPort: number;
    private readonly _wsPort: number;

    private _httpServer: Server;
    private _wsServer: WebSocketServer;
    private _clients: Set<WebSocket> = new Set();

    private _playerCounter: number = 0;

    constructor(
        private _gameFactory: GameFactory,
        private _validationService: ValidationService,
        private _inventoryService: InventoryService,
        private _gameLoop: GameLoopService,
        private _staticData: StaticDataService,
        private _demoService: DemoService,
    ) {
        this._httpPort = _staticData.config.HTTP_PORT;
        this._wsPort = _staticData.config.WS_PORT;
        this._httpServer = createServer((req, res) => {
            this.serveStatic(req, res);
        });
        this._wsServer = new WebSocketServer({port: this._wsPort});
    }

    async start(): Promise<void> {
        this._wsServer.on("connection", (ws) => {
            this._clients.add(ws);
            ws.on("message", (data) => this.handleMessage(ws, data.toString()));
            ws.on("close", () => this._clients.delete(ws));
        });
        await new Promise<void>((resolve) => {
            this._httpServer.listen(this._httpPort, () => resolve());
        });
    }

    stop(): void {
        this._httpServer.close();
        this._wsServer.close();
        for (const client of this._clients) {
            client.close();
        }
    }

    broadcast(snapshot: WorldSnapshot): void {
        const message = JSON.stringify(snapshot);
        for (const client of this._clients)
            if (client.readyState === WebSocket.OPEN)
                client.send(message);
    }

    private serveStatic(req: IncomingMessage, res: ServerResponse): void {
        const url = req.url ?? "/";
        if (url === "/demo") this._demoService.start();
        let filePath = join(process.cwd(), "public", normalize(url));
        if (url === "/" || url === "" || url === "/demo")
            filePath = join(process.cwd(), "public", "index.html");
        readFile(filePath)
            .then((content) => {
                const mime = MIME_TYPES[extname(filePath)] ?? "application/octet-stream";
                res.writeHead(200, {"Content-Type": mime});
                res.end(content);
            })
            .catch(() => {
                res.writeHead(404);
                res.end("Not Found");
            });
    }

    private async handleMessage(ws: WebSocket, data: string): Promise<void> {
        try {
            const msg = JSON.parse(data);
            await this.processCommand(ws, msg);
        } catch (err) {
            this.sendError(ws, err instanceof Error ? err.message : "invalid message");
        }
    }

    private async processCommand(ws: WebSocket, msg: Record<string, unknown>): Promise<void> {
        const playerId = msg.playerId as string;
        switch (msg.cmd) {
            case "spawnPlayer": {
                this._playerCounter++;
                const id = `p${this._playerCounter}`;
                const x = Math.random() * this._staticData.config.WORLD_WIDTH;
                const y = Math.random() * this._staticData.config.WORLD_HEIGHT;
                const player = this._gameFactory.createPlayer(id, {x, y});
                this._gameLoop.world.addPlayer(player);
                break;
            }
            case "spawnItem": {
                const types = Object.keys(this._staticData.config.ITEMS);
                const type = types[Math.floor(Math.random() * types.length)];
                const x = Math.random() * this._staticData.config.WORLD_WIDTH;
                const y = Math.random() * this._staticData.config.WORLD_HEIGHT;
                await this._inventoryService.spawnItem(type, {x, y});
                break;
            }
            case "setTarget": {
                const result = this._validationService.validateMove(playerId, msg.x as number, msg.y as number);
                if (!result.ok) {
                    this.sendError(ws, result.reason);
                    break;
                }
                const player = this._gameLoop.world.getPlayer(playerId);
                player.setTarget({x: msg.x as number, y: msg.y as number});
                break;
            }
            case "giveItem":
                await this._inventoryService.give(playerId, msg.itemType as string, msg.amount as number | undefined);
                break;
            case "dropItem": {
                const result = this._validationService.validateDrop(playerId, msg.itemId as string);
                if (!result.ok) {
                    this.sendError(ws, result.reason);
                    break;
                }
                await this._inventoryService.dropItemWithId(playerId, msg.itemId as string);
                break;
            }
            case "pickupItem": {
                const result = this._validationService.validatePickup(playerId, msg.groundItemId as string);
                if (!result.ok) {
                    this.sendError(ws, result.reason);
                    break;
                }
                await this._inventoryService.pickup(playerId, msg.groundItemId as string);
                break;
            }
            case "useItem": {
                const result = this._validationService.validateUse(playerId, msg.itemId as string);
                if (!result.ok) {
                    this.sendError(ws, result.reason);
                    break;
                }
                await this._inventoryService.useItemWithId(playerId, msg.itemId as string);
                break;
            }
            case "getInventory": {
                const inventory: IItemInstance[] = this._inventoryService.getInventory(playerId);
                ws.send(JSON.stringify({inventory}));
                break;
            }
        }
    }

    private sendError(ws: WebSocket, reason: string): void {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({error: reason}));
        }
    }
}
