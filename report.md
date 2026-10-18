# report.md — база знаний (факты и грабли)

## Факты кода

- В коммиты не попадают комментарии и TODO-маркеры (пользователь зачищает). Код пишется чистым, без комментариев.
- Стуб метода с типом возврата: `throw new Error("Not implemented")` — это код, не комментарий; в коммит попадает.
- Коммиты делает пользователь; координатор только готовит файлы и верифицирует.

## Архитектура (послойная, GRASP/SOLID)

- Глобальных переменных нет. Код в глобальном контексте — только `src/entry.ts` (композиция) и `src/test/runner.ts` (тестовый entry). Свободные метод-декларации — только в слое `src/utils/`.
- Объекта `src/config.ts` больше нет (удалён). Данные config — поле `StaticDataService`: `readonly config = {...} as const`. Типа `Config` нет — config передаётся как `any` (решение пользователя).
- `src/services/StaticDataService.ts` — единственный владелец объекта config; остальные классы получают его через DI (конструктор).
- `src/services/GameFactory.ts` — stateless: ctor хранит ТОЛЬКО ссылки на сервисы (`staticDataService`, `itemRegistry`, `gameLoop`), мира нет; `createGameWorld(): WorldState` — чистое создание; `createPlayer(id, position)` — создание `Player` + `gameLoop.register(player)`; `createEffect(type): IEffect` — создание `ActiveEffect` (bandage/flare) + `gameLoop.register(effect)`, unknown type → throw; `createAllItems()` — сейчас приемлемо; в будущем — методы `create<Type>()` на каждый тип предмета.
- `src/services/GameLoopService.ts` — единственный владелец `WorldState` (заменил `TickService`, `TickService.ts` удалён): ctor `(effectService, storage, broadcast)` — фабрики НЕТ; `initialize(world: WorldState)` — принимает готовый мир (создаёт его entry через фабрику); `get world(): WorldState` — публичный readonly-геттер (не инициализирован → throw); `_tickables: ITickable[]` + `register(tickable)` (push) + `tick()` (forEach-tick + null-filter); `start/stop` — стубы (Stage 15).
- Сервисы НЕ получают `WorldState` в конструкторах: `InventoryService(gameLoop, storage)`, `ValidationService(gameLoop)`, `GameServer(gameFactory, validationService, inventoryService, gameLoop)` — мир через геттер `gameLoop`; `EffectService` — без мира вообще, `tick(world)` вызывается из цикла с аргументом (иначе — циклическая зависимость конструкторов).
- `src/services/ItemRegistryService.ts` — private `Map<string, IItem>`; `register/get/getAll`. Реестр предметов — только через этот сервис.
- `src/utils/` — единственный дом утилит: `distance.ts` (`sqrDistance`), `validation.ts` (`validatePosition(position, width, height, label)` — finite + границы, возвращает копию; `validateAmount` — finite > 0; `validateStat` — finite >= 0; все кидают). Границы передаются аргументами, config не импортируется.
- `Player`/`WorldState` получают config через конструктор как `any` (типа `Config` нет); предметы — скалярные срезы (`Medkit: constructor(addHP: number)`).
- `WorldState.addPlayer(player: Player): void` — принимает готового игрока (дубликат id → throw); `addGroundItem` валидирует позицию через utils `validatePosition`.
- `MemoryStorage` — `constructor(private _delayMs: number)`; delay заходит из entry (`staticDataService.config.STORAGE_DELAY_MS`).
- Предметы не саморегистрируются: классы предметов экспортируются, регистрация — только в `GameFactory.createAllItems()`.

## Правила конструкторов (зафиксировано пользователем)

- Конструктор только получает и хранит ссылки на нужные сервисы (DI). Создание объектов в конструкторе — запрещено.
- Создание/инициализация — отдельными методами (паттерн `initialize()`). Пример: `GameLoopService.initialize(world)` принимает готовый мир (создан entry через фабрику); публичных полей, инициализированных в ctor, нет.
- Фабрика stateless: `WorldState` не держит, «уже создан»-проверок нет. Фабрика регистрирует созданные сущности в `gameLoop` (`register`).
- Владелец `WorldState` — `GameLoopService`: хранит мир, полученный в `initialize(world)`, наружу — только readonly-геттер `world`. Сервисы `WorldState` в конструкторах не получают — держат ссылку на `GameLoopService` или получают мир аргументом метода (`EffectService.tick(world)`).
- Entry point: `world = gameFactory.createGameWorld()` → `gameLoop.initialize(world)`. Дальше мир доступен через `gameLoop.world`.

## Именование валидаторов (зафиксировано пользователем)

- Валидация — `validate<Thing>` (метод КИДАЕТ при ошибке, возвращает значение). Имя вида `valid<Thing>` запрещено — выглядит как boolean-проверка.

## Именование приватных полей (зафиксировано пользователем)

- Все приватные поля начинаются с `_` (например `_hp`, `_position`, `_effects`, `_world`, `_config`). Публичные поля — без префикса (например `id` в `Player`).

## Инкапсуляция (правила, заданные пользователем)

- Владелец состояния валидирует свои поля; предметы/сервисы НИКОГДА не клампят и не валидируют числа — только вызывают методы владельца (Medkit: `player.addHP(this.addHP)`).
- `src/core/player.ts` — `implements ITickable`; private `_config/_hp/_armor/_position/_target/_effects: IEffect[]`; публичные readonly-геттеры: `position`/`target` возвращают копии, `effects`/`getEffect` — ссылки (клоны только в `toData`). Мутации: `addHP`/`addArmor` (amount — finite > 0, cap `Math.min`), `setTarget` (out-of-bounds → throw), `moveBy` (clamp в мир), `addEffect(effect: IEffect)` (дубль type → замена на месте, throw при null), `getEffect`, `removeEffect`, `tick()` (только cleanup: `advanceEffects()`), private `advanceEffects()` (фильтрует null + `remainingTicks < 0`), `toData(): PlayerData` (effects → `effect.clone()`). Эффекты тикает `GameLoopService` (не `Player.tick()`).
- `WorldState` — private Map + getter `tick`; `addPlayer(player)`, `removePlayer`, `getPlayer/getPlayers`, `addGroundItem`, `removeGroundItem`, `getGroundItems`, `getInventory/setInventory`, `advanceTick`, `getSnapshot()`.
- `src/types.ts` — все data-интерфейсы полностью `readonly`-поля; `ITickable { tick(): void }`; `IEffect extends ITickable { type, remainingTicks, data?, clone(): IEffect }` (методы в интерфейсах разрешены — зафиксировано пользователем). Конкретная реализация — класс `ActiveEffect` в `src/core/effect.ts` (tick: `remainingTicks--`, clone: `new ActiveEffect(...)`). Геттеры `Player.effects` и `getEffect` возвращают ссылки на реальные объекты (не клоны); клонирование — только при сериализации (`toData` → `effect.clone()`). Мутация `Player._effects` — `push`/замена по индексу (`addEffect`) или immutable-фильтр (`advanceEffects`, `removeEffect`).
- `IItem.onUse?(player, world)` — сигнатура требует два аргумента, даже если предмет использует один.

## Окружение

- Node v24: `C:\Program Files\nodejs\node.exe`; `.cmd` не спавнить.
- tsc: `node.exe node_modules\typescript\bin\tsc --noEmit --project tsconfig.json`.
- Тесты: `node.exe node_modules\tsx\dist\cli.mjs src\test\runner.ts` (совпадает с `npm test`).
- Spawn tsc/node/npm из DSH-песочницы требует `danger-full-access` (SetNamedSecurityInfoW Win32 5).
- Subagent не запускает исполняемые файлы — все команды выполняет координатор.

## Pitfalls & dead ends

- Пустое тело метода с типом возврата (не void/any) → TS2355. Лечится `throw new Error(...)`.
- `IItem.onUse` требует 2 аргумента `(player, world)` — вызов с одним → TS2554.
- `validatePosition` возвращает копию; вызывающий, которому нужна только проверка (world), возвращаемое значение не использует — throw при ошибке.
- Держание `WorldState` в ctor или как поле сервиса/фабрики (например `GameFactory.world`) — нарушение «ctor = только ссылки на сервисы» и stateless-фабрики; мир хранит `GameLoopService` (получает в `initialize(world)`).
- Циклическая зависимость `GameLoopService` ↔ `GameFactory` устранена: фабрика НЕ в ctor `GameLoopService`; `GameLoopService.initialize(world)` принимает готовый мир; фабрика получает `gameLoop` в ctor (DI: gameLoop → factory).
- `Player.tick()` НЕ тикает эффекты (они тикаются `GameLoopService` напрямую) — иначе double-tick. `Player.tick()` = только `advanceEffects()` (cleanup).
- Clone-safety: `ActiveEffect` ctor валидирует `remainingTicks < 0` (non-negative, НЕ `<= 0`) — иначе `clone()` сломается для эффектов на `remainingTicks === 0`.
- Порядок тика: игроки регистрируются раньше эффектов → `Player.tick()` (cleanup) идёт ДО `ActiveEffect.tick()` (декремент) в одном проходе `GameLoopService.tick()` → эффект с N тиков живёт N+1 тиков.
