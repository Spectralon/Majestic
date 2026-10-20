# Majestic

Server-authoritative item system на Node.js + TypeScript: мир с тиковым циклом, игроки, предметы (medkit / armor / bandage / flare), инвентари, эффекты и ground items с таймаутом. Тонкий canvas-фронтенд наблюдает за миром через WS-снапшоты — вся логика на сервере.

## Запуск

```bash
npm install
npm run build
npm start
```

- HTTP: `http://localhost:3000` — canvas-фронтенд (статика из `public/`)
- WS: `ws://localhost:3001` — каждый тик сервер шлёт всем клиентам `WorldSnapshot`
- Демо-сценарий: `http://localhost:3000/demo` — сервер сам запускает скриптованный сценарий (два игрока, подбор, flare-подсветка, use, конкурентный подбор); клиент только наблюдает. Прогон ≈ несколько секунд; повторное открытие `/demo` запускает новый прогон (игроки предыдущего прогона не удаляются)

## Тесты и верификация

Каноничная цепочка — `verify.bat` (typecheck → build → tests):

```bat
verify.bat
```

Или по шагам:

```bash
npm run typecheck   # tsc --noEmit
npm run build       # tsc → dist/
npm run test        # тестовые сценарии (tsx src/test/runner.ts)
```

Тесты — in-process сценарии (`src/test/runner.ts`): smoke, drop-pickup, ground-timeout, use-effect, concurrent-pickup. `npm run test` использует tsx, который не работает под песочницей (spawn EPERM) — поэтому каноничный путь проверки именно `verify.bat` (тесты из `dist/`, без дочерних процессов).

## Предметы

| Type    | onUse                              | onDrop                              |
| ------- | ---------------------------------- | ----------------------------------- |
| medkit  | `addHP(100)`                       | —                                   |
| armor   | `addArmor(30)` (не стекуется)      | —                                   |
| bandage | `addHP(5)` + эффект на 4 тика (+5/тик) | —                               |
| flare   | — (использовать нельзя)            | `FlareService.applyHighlight` — подсветка игроков в радиусе 100 на 30 тиков |

## Архитектура

Послойная, GRASP/SOLID; глобальных переменных нет — код в глобальном контексте только в `src/entry.ts` (композиция) и `src/test/runner.ts`.

```
src/
  entry.ts                      — DI-композиция, точка входа
  objects/                      — доменные объекты и типы данных
    abstract.ts                 — ITickable, IEffect, IItemInstance
    data.ts                     — Vec2, EffectData, PlayerData, WorldSnapshot (только типы)
    World.ts                    — World: tick, players, ground items, snapshot
    Player.ts                   — Player: position/target/hp/armor/effects/inventory, движение к target
    Inventory.ts                — Inventory: стэкинг инстансов (stackable-флаг на IItemInstance)
    ActiveEffect.ts             — ActiveEffect: remainingTicks, tick() → boolean
    GroundItem.ts               — GroundItem (только тип)
    items/                      — IItem.ts + Medkit / Armor / Bandage / Flare
  infrastructure/
    GameFactory.ts              — stateless-фабрика (world, players, items, ground items, effects)
    GameServer.ts               — HTTP-статика (порт 3000) + WS (порт 3001)
    services/
      StaticDataService.ts      — единственный владелец config (readonly as const)
      GameLoopService.ts        — ЕДИНСТВЕННЫЙ владелец World и ЕДИНСТВЕННЫЙ, кто тикает ITickable;
                                  Observer: onSnapshot(listener)
      ItemRegistryService.ts    — реестр предметов
      ValidationService.ts      — validateMove/Pickup/Use/Drop (fail → {ok:false, reason})
      DemoService.ts            — скриптованный демо-сценарий для /demo
    storage/
      IStorage.ts / MemoryStorage.ts — асинхронное хранилище (delay из config)
  services/
    EffectService.ts            — применяет onUse эффектов каждый тик
    FlareService.ts             — подсветка игроков при drop flare
    GroundItemService.ts        — удаление истёкших ground items
    InventoryService.ts         — give/drop/pickup/use/spawn (основная логика в dropItemWithId/useItemWithId)
  utils/
    distance.ts / validation.ts
  test/
    runner.ts + scenarios/
public/
  index.html + app.js           — canvas-фронтенд
```

Ключевые решения:

- **Владелец мира — `GameLoopService`**: мир создаётся entry через фабрику и передаётся в `initialize(world)`; наружу — только readonly-геттер `world`. Сервисы мир в ctor не получают и не кэшируют — читают `gameLoop.world` в методах.
- **Observer для снапшотов**: `GameLoopService` НЕ знает про сервер — `tick()` раздаёт snapshot всем подписчикам `onSnapshot(listener)`; `GameServer` подписывается в собственном конструкторе (`broadcast` приватный). Зависимый цикл `loop → server` и TDZ-замыкание на `server` исключены.
- **`ITickable.tick(): boolean`**: `true` = остаться в цикле, `false` = отработал, `GameLoopService` выносит. Имплементы: `Player` (всегда `true`), `EffectService`, `GroundItemService`, `ActiveEffect` (самоудаляется при 0 тиков). `GameLoopService.tick()` — единственный, кто вызывает `tick()`.
- **Цикл тика**: `_tickables.filter(t => t.tick())` → `world.advanceTick()` → snapshot → каждый listener. Тик — 100мс.
- **Конструкторы — только ссылки (DI)**; создание объектов — в `initialize()`/методах фабрики. Из config-числа в ctor разрешена инициализация `readonly`-поля (GameLoopService, MemoryStorage).
- **Владелец состояния валидирует свои поля**; предметы не клампят числа — только `player.addHP(...)` и т.п.
- **Расширение предметом**: новый предмет = класс в `src/objects/items/` + `create<Type>()` в `GameFactory` + запись в `StaticDataService.config.ITEMS` + вызов в `createAllItems()`.

## WS-протокол

Клиент → сервер (JSON `{cmd, ...}`): `spawnPlayer`, `spawnItem`, `setTarget(playerId, x, y)`, `giveItem(playerId, itemType, amount?)`, `dropItem(playerId, itemId)`, `pickupItem(playerId, groundItemId)`, `useItem(playerId, itemId)`, `getInventory(playerId)`.

Сервер → клиент: каждый тик `WorldSnapshot` (`{tick, players, groundItems, inventories}`) + `{error}` при ошибке валидации.
