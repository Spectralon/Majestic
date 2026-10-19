# report.md — база знаний (факты и грабли)

## Факты кода

- В коммиты не попадают комментарии и TODO-маркеры (пользователь зачищает). Код пишется чистым, без комментариев.
- Стуб метода с типом возврата: `throw new Error("Not implemented")` — это код, не комментарий; в коммит попадает.
- Коммиты делает пользователь; координатор только готовит файлы и верифицирует.

## Архитектура (послойная, GRASP/SOLID)

- Глобальных переменных нет. Код в глобальном контексте — только `src/entry.ts` (композиция) и `src/test/runner.ts` (тестовый entry). Свободные метод-декларации — только в слое `src/utils/`.
- Объекта `src/config.ts` больше нет (удалён). Данные config — поле `StaticDataService`: `readonly config = {...} as const`. Типа `Config` нет — config передаётся как `any` (решение пользователя).
- `src/services/StaticDataService.ts` — единственный владелец объекта config; остальные классы получают его через DI (конструктор).
- `src/services/GameFactory.ts` — stateless: ctor хранит ТОЛЬКО ссылки на сервисы (`staticDataService`, `itemRegistry`, `gameLoop`), мира нет; `createGameWorld(): WorldState` — чистое создание; `createPlayer(id, position)` — создание `Player` + `gameLoop.register(player)`; `createEffect(type): IEffect` — создание `ActiveEffect` (bandage/flare) + `gameLoop.register(effect)`, unknown type → throw; `createMedkit()/createArmor()/createBandage()/createFlare()` — создание предмета + `itemRegistry.register(item)`; `createAllItems()` вызывает все четыре. `Flare` — чисто визуальный предмет (30-tick highlight), `onUse` отсутствует (в `IItem` поле `onUse` опциональное).
- `src/services/GameLoopService.ts` — единственный владелец `WorldState` (заменил `TickService`, `TickService.ts` удалён): ctor `(storage, broadcast)` — фабрики и effectService НЕТ; `initialize(world: WorldState)` — принимает готовый мир (создаёт его entry через фабрику); `get world(): WorldState` — публичный readonly-геттер (не инициализирован → throw); `_tickables: ITickable[]` + `register(tickable)` (push) + `tick()` (forEach-tick + null-filter); `start/stop` — стубы (Stage 15).
- Сервисы НЕ получают `WorldState` в конструкторах: `InventoryService(gameLoop, storage)`, `ValidationService(gameLoop)`, `GameServer(gameFactory, validationService, inventoryService, gameLoop)` — мир через геттер `gameLoop`; `EffectService(gameLoop)` — имплементирует `ITickable`, сам регистрируется в `gameLoop.register(this)` в `initialize()` (вызывается в entry после `gameLoop.initialize(world)`).
- `src/services/ItemRegistryService.ts` — private `Map<string, IItem>`; `register/get/getAll`. Реестр предметов — только через этот сервис.
- `src/utils/` — единственный дом утилит: `distance.ts` (`sqrDistance`), `validation.ts` (`validatePosition(position, width, height, label)` — finite + границы, возвращает копию; `validateAmount` — finite > 0; `validateStat` — finite >= 0; все кидают). Границы передаются аргументами, config не импортируется.
- `Player`/`WorldState` получают config через конструктор как `any` (типа `Config` нет); предметы — скалярные срезы (`Medkit: constructor(addHP: number)`, `Bandage: constructor(healPerTick: number)`).
- `WorldState.addPlayer(player: Player): void` — принимает готового игрока (дубликат id → throw); `addGroundItem` валидирует позицию через utils `validatePosition`.
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
