import { createServer, type Server, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { WebSocketServer, WebSocket } from "ws";
import type { GameFactory } from "../services/GameFactory.js";
import type { ValidationService } from "../services/ValidationService.js";
import type { InventoryService } from "../services/InventoryService.js";
import type { GameLoopService } from "../services/GameLoopService.js";
import type { WorldSnapshot, ItemInstance } from "../types.js";
import { StaticDataService } from "../services/StaticDataService.js";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

export class GameServer {
  private _httpServer: Server;
  private _wsServer: WebSocketServer;
  private _clients: Set<WebSocket> = new Set();
  private _playerCounter: number = 0;
  private _wsToPlayer: Map<WebSocket, string> = new Map();

  private readonly _httpPort: number;
  private readonly _wsPort: number;

  constructor(
      private _gameFactory: GameFactory,
      private _validationService: ValidationService,
      private _inventoryService: InventoryService,
      private _gameLoop: GameLoopService,
      private _staticData: StaticDataService,
  ) {
    this._httpPort = _staticData.config.HTTP_PORT;
    this._wsPort = _staticData.config.WS_PORT;
    this._httpServer = createServer((req, res) => {
      this.serveStatic(req, res);
    });
    this._wsServer = new WebSocketServer({ port: this._wsPort });
    this._wsServer.on("connection", (ws) => {
      this._clients.add(ws);
      this._playerCounter++;
      const playerId = `p${this._playerCounter}`;
      const player = this._gameFactory.createPlayer(playerId, { x: 400, y: 300 });
      this._gameLoop.world.addPlayer(player);
      this._wsToPlayer.set(ws, playerId);
      ws.send(JSON.stringify({ playerId }));
      ws.on("message", (data) => this.handleMessage(ws, data.toString()));
      ws.on("close", () => {
        this._clients.delete(ws);
        this._wsToPlayer.delete(ws);
      });
    });
  }

  async start(): Promise<void> {
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
    let filePath = join(process.cwd(), "public", normalize(url));
    if (url === "/" || url === "")
      filePath = join(process.cwd(), "public", "index.html");
    readFile(filePath)
      .then((content) => {
        const mime = MIME_TYPES[extname(filePath)] ?? "application/octet-stream";
        res.writeHead(200, { "Content-Type": mime });
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
      case "give":
        await this._inventoryService.give(playerId, msg.type as string, msg.amount as number | undefined);
        break;
      case "drop": {
        const result = this._validationService.validateDrop(playerId, msg.type as string);
        if (!result.ok) {
          this.sendError(ws, result.reason);
          break;
        }
        await this._inventoryService.drop(playerId, msg.type as string);
        break;
      }
      case "pickup": {
        const result = this._validationService.validatePickup(playerId, msg.groundItemId as string);
        if (!result.ok) {
          this.sendError(ws, result.reason);
          break;
        }
        await this._inventoryService.pickup(playerId, msg.groundItemId as string);
        break;
      }
      case "use": {
        const result = this._validationService.validateUse(playerId, msg.type as string);
        if (!result.ok) {
          this.sendError(ws, result.reason);
          break;
        }
        await this._inventoryService.use(playerId, msg.type as string);
        break;
      }
      case "getInventory": {
        const inventory: ItemInstance[] = this._inventoryService.getInventory(playerId);
        ws.send(JSON.stringify({ inventory }));
        break;
      }
    }
  }

  private sendError(ws: WebSocket, reason: string): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ error: reason }));
    }
  }
}
