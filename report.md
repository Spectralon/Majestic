# report.md — база знаний (факты и грабли)

## Факты кода

- В коммиты не попадают комментарии и TODO-маркеры (пользователь зачищает). Код пишется чистым, без комментариев.
- Стуб метода с типом возврата: `throw new Error("Not implemented")` — это код, не комментарий; в коммит попадает.
- Коммиты делает пользователь; координатор только готовит файлы и верифицирует.

## Архитектура (послойная, GRASP/SOLID)

- Глобальных переменных нет. Код в глобальном контексте — только `src/entry.ts` (композиция) и `src/test/runner.ts` (тестовый entry). Свободные метод-декларации — только в слое `src/utils/`.
- Объекта `src/config.ts` больше нет (удалён). Данные config — поле `StaticDataService`: `readonly config = {...} as const`. Типа `Config` нет — config передаётся как `any` (решение пользователя).
- `src/services/StaticDataService.ts` — единственный владелец объекта config; остальные классы получают его через DI (конструктор).
- `src/services/GameFactory.ts` — stateless: ctor хранит ТОЛЬКО ссылки на сервисы (`staticDataService`, `itemRegistry`, `gameLoop`), мира нет; `createGameWorld(): WorldState` — чистое создание; `createPlayer(id, position)` — создание `Player` + `gameLoop.register(player)`; `createEffectOrNull(type): IEffect | null` — создание `ActiveEffect` (bandage/flare) + `gameLoop.register(effect)`, unknown type → null; `createEffect(type): IEffect` — вызывает `createEffectOrNull`, null → throw; `createMedkit()/createArmor()/createBandage()/createFlare()` — создание предмета + `itemRegistry.register(item)`; `createAllItems()` вызывает все четыре. `Flare` — чисто визуальный предмет (30-tick highlight), `onUse` отсутствует (в `IItem` поле `onUse` опциональное).
- `src/services/GameLoopService.ts` — единственный владелец `WorldState` (заменил `TickService`, `TickService.ts` удалён): ctor `(storage, broadcast)` — фабрики и effectService НЕТ; `initialize(world: WorldState)` — принимает готовый мир (создаёт его entry через фабрику); `get world(): WorldState` — публичный readonly-геттер (не инициализирован → throw); `_tickables: ITickable[]` + `register(tickable)` (push) + `tick()` (forEach-tick + null-filter); `start/stop` — стубы (Stage 15).
- Сервисы НЕ получают `WorldState` в конструкторах: `InventoryService(gameLoop, storage, itemRegistry, gameFactory, staticDataService)`, `ValidationService(gameLoop)`, `GameServer(gameFactory, validationService, inventoryService, gameLoop)` — мир через геттер `gameLoop`; `EffectService(gameLoop)` — имплементирует `ITickable`, сам регистрируется в `gameLoop.register(this)` в `initialize()` (вызывается в entry после `gameLoop.initialize(world)`).
- `src/core/inventory.ts` — `Inventory`: поле `_items: ItemInstance[]` + `_counter: number`; `get items(): readonly ItemInstance[]`; `addItem(item: IItem, amount=1): ItemInstance` — если `item.stackable` и уже есть `item.type`, то `amount += amount` (иммутабельно), иначе новый `inst_N` (`amount = stackable ? amount : 1`); `removeItem(item: IItem): ItemInstance` — поиск по `item.type` (нет → throw), `amount > 1` → decrement, иначе удаляет элемент; `load(items): void` — копирует `_items` и пересчитывает `_counter` из max `inst_N`.
- `Player` — `private _inventory: Inventory` (создаётся `new Inventory()` в ctor) + публичный readonly-геттер `get inventory(): Inventory`.
- `src/services/InventoryService.ts` — ctor `(gameLoop, storage, itemRegistry, gameFactory, staticDataService)`; мир читается через `gameLoop.world` (в ctor НЕ хранится). `getInventory(playerId): ItemInstance[]` — копия `player.inventory.items`; `give(playerId, type, amount=1)` — `player.inventory.addItem(item, amount)` (стэкинг внутри `Inventory`), валидация `amount` (integer >= 1) + `saveInventory`; `drop(playerId, type)` — `player.inventory.removeItem(item)` + `saveInventory` + `GroundItem` (`id = ground_<ts>_<rand>`, `position = {...player.position}`, `expiresAtTick = world.tick + GROUND_LIFETIME_TICKS`) + `world.addGroundItem` + `saveGroundItem`; `pickup(playerId, groundItemId)` — `sqrDistance <= pickupRadius^2`, `removeGroundItem` + `deleteGroundItem` + `player.inventory.addItem(item)` + `saveInventory`; `use(playerId, type)` — `gameFactory.createEffectOrNull(type)`: effect → `player.addEffect(effect)`, иначе `item.onUse?.(player, world)`, затем `player.inventory.removeItem(item)` + `saveInventory`; `loadInventory(playerId)` — `storage.loadInventory`, не null → `player.inventory.load(items)`. Каждый мутающий метод делает `saveInventory`.
- `src/services/ItemRegistryService.ts` — private `Map<string, IItem>`; `register/get/getAll`. Реестр предметов — только через этот сервис.
- `src/utils/` — единственный дом утилит: `distance.ts` (`sqrDistance`), `validation.ts` (`validatePosition(position, width, height, label)` — finite + границы, возвращает копию; `validateAmount` — finite > 0; `validateStat` — finite >= 0; все кидают). Границы передаются аргументами, config не импортируется.
- `Player`/`WorldState` получают config через конструктор как `any` (типа `Config` нет); предметы — скалярные срезы (`Medkit: constructor(addHP: number)`, `Bandage: constructor(healPerTick: number)`).
- `WorldState.addPlayer(player: Player): void` — принимает готового игрока (дубликат id → throw); `addGroundItem` валидирует позицию через utils `validatePosition`. Инвентари `WorldState` НЕ хранит (поля `getInventory`/`setInventory`/`_inventories` удалены): `getSnapshot()` собирает `inventories` из `getPlayers().map((p) => [p.id, [...p.inventory.items]])`.
- `MemoryStorage` — `constructor(private _delayMs: number)`; delay заходит из entry (`staticDataService.config.STORAGE_DELAY_MS`).
- Предметы не саморегистрируются: классы предметов экспортируются, регистрация — только в `GameFactory.createAllItems()`.

## Правила конструкторов (зафиксировано пользователем)

- Конструктор только получает и хранит ссылки на нужные сервисы (DI). Создание объектов в конструкторе — запрещено.
- Создание/инициализация — отдельными методами (паттерн `initialize()`). Пример: `GameLoopService.initialize(world)` принимает готовый мир (создан entry через фабрику); публичных полей, инициализированных в ctor, нет.
- Фабрика stateless: `WorldState` не держит, «уже создан»-проверок нет. Фабрика регистрирует созданные сущности в `gameLoop` (`register`).
- Владелец `WorldState` — `GameLoopService`: хранит мир, полученный в `initialize(world)`, exposes только readonly-геттер `world`.

## Pitfalls & dead ends

- Держание `WorldState` в ctor или как поле сервиса/фабрики (например `GameFactory.world`) — нарушение «ctor = только ссылки на сервисы» и stateless-фабрики; мир хранит `GameLoopService` (получает в `initialize(world)`).
- Циклическая зависимость `GameLoopService` ↔ `GameFactory` устранена: фабрика НЕ в ctor `GameLoopService`; `GameLoopService.initialize(world)` принимает готовый мир; фабрика получает `gameLoop` в ctor (DI: gameLoop → factory).
- Циклическая зависимость `GameLoopService` ↔ `EffectService` устранена: `EffectService` получает `GameLoopService` в ctor и сам регистрируется в `initialize()`; `GameLoopService` НЕ знает об `EffectService`.
- `Player.tick()` НЕ тикает эффекты (они тикаются `GameLoopService` напрямую) — иначе double-tick. `Player.tick()` = только `advanceEffects()` (cleanup).
- Clone-safety: `ActiveEffect` ctor валидирует `remainingTicks < 0` (non-negative, НЕ `<= 0`) — иначе `clone()` сломается для эффектов на `remainingTicks === 0`.
- Порядок тика: игроки регистрируются раньше эффектов → `Player.tick()` (cleanup) идёт ДО `ActiveEffect.tick()` (декремент) в одном проходе `GameLoopService.tick()` → эффект с N тиков живёт N+1 тиков.
- `tsx` под песочницей workspace-write: `spawn EPERM` — esbuild запускает дочерний процесс, а kernel-ограждение Windows блокирует grandchild-spawn (структурно; правила dsh-allow это не снимают — они компилируются в профиль только на macOS/Seatbelt). Тесты через tsx под workspace-write не запускать.
- Верификация без дочерних процессов (это `verify.bat`): `tsc --noEmit` → `tsc` (сборка в `dist/`) → `node dist\test\runner.js`. Smoke — in-process (в коде нет `child_process`) — проходит полностью под workspace-write, без одобрений и без `danger-full-access`.
- dsh-allow: правило `E:\dev` (все 5 возможностей, recursive) добавлено пользователем 2026-10-19 в `C:\Users\USER\.dsh\dsh-allow.json` — покрывает pre-execute gate, но не kernel-ограждение Windows.
