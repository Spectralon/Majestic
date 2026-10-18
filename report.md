# report.md — база знаний (факты и грабли)

## Факты кода

- В коммиты не попадают комментарии и TODO-маркеры (пользователь зачищает). Код пишется чистым, без комментариев.
- Стуб метода с типом возврата: `throw new Error("Not implemented")` — это код, не комментарий; в коммит попадает.
- Коммиты делает пользователь; координатор только готовит файлы и верифицирует.

## Архитектура (послойная, GRASP/SOLID)

- Глобальных переменных нет. Код в глобальном контексте — только `src/entry.ts` (композиция) и `src/test/runner.ts` (тестовый entry). Свободные метод-декларации — только в слое `src/utils/`.
- Объекта `src/config.ts` больше нет (удалён). Данные config — поле `StaticDataService`: `readonly config = {...} as const`. Типа `Config` нет — config передаётся как `any` (решение пользователя).
- `src/services/StaticDataService.ts` — единственный владелец объекта config; остальные классы получают его через DI (конструктор).
- `src/services/GameFactory.ts` — ctor хранит ТОЛЬКО ссылки на сервисы (`staticDataService`, `itemRegistry`); `createGameWorld(): WorldState` — единственный создатель мира (повторный вызов → throw); `createPlayer(id, position)` — единственный создатель `Player` (требует созданного мира, создаёт игрока и добавляет в world); `createAllItems()` — сейчас приемлемо; в будущем — методы `create<Type>()` на каждый тип предмета, возвращают созданный предмет и могут вызывать другие сервисы.
- `src/services/ItemRegistryService.ts` — private `Map<string, IItem>`; `register/get/getAll`. Реестр предметов — только через этот сервис.
- `src/utils/` — единственный дом утилит: `distance.ts` (`sqrDistance`), `validation.ts` (`validatePosition(position, width, height, label)` — finite + границы, возвращает копию; `validateAmount` — finite > 0; `validateStat` — finite >= 0; все кидают). Границы передаются аргументами, config не импортируется.
- `Player`/`WorldState` получают config через конструктор как `any` (типа `Config` нет); предметы — скалярные срезы (`Medkit: constructor(addHP: number)`).
- `WorldState.addPlayer(player: Player): void` — принимает готового игрока (дубликат id → throw); `addGroundItem` валидирует позицию через utils `validatePosition`.
- `MemoryStorage` — `constructor(private delayMs: number)`; delay заходит из entry (`staticDataService.config.STORAGE_DELAY_MS`).
- Предметы не саморегистрируются: классы предметов экспортируются, регистрация — только в `GameFactory.createAllItems()`.

## Правила конструкторов (зафиксировано пользователем)

- Конструктор только получает и хранит ссылки на нужные сервисы (DI). Создание объектов в конструкторе — запрещено.
- Создание/инициализация — отдельными методами (паттерн `initialize()`). Пример: `GameFactory.createGameWorld()` создаёт и возвращает `WorldState`; публичных полей, инициализированных в ctor, нет.
- Entry point мир получает из метода: `const world = gameFactory.createGameWorld();` — не из поля фабрики.

## Именование валидаторов (зафиксировано пользователем)

- Валидация — `validate<Thing>` (метод КИДАЕТ при ошибке, возвращает значение). Имя вида `valid<Thing>` запрещено — выглядит как boolean-проверка.

## Инкапсуляция (правила, заданные пользователем)

- Владелец состояния валидирует свои поля; предметы/сервисы НИКОГДА не клампят и не валидируют числа — только вызывают методы владельца (Medkit: `player.addHP(this.addHP)`).
- `src/core/player.ts` — private `_hp/_armor/_position/_target/_effects` + `config`, публичные геттеры readonly (возвращают копии). Мутации: `addHP`/`addArmor` (amount — finite > 0, cap `Math.min`), `setTarget` (out-of-bounds → throw), `moveBy` (clamp в мир), `addEffect` (дубль type → throw), `getEffect`, `removeEffect`, `advanceEffects`, `toData(): PlayerData`.
- `WorldState` — private Map + getter `tick`; `addPlayer(player)`, `removePlayer`, `getPlayer/getPlayers`, `addGroundItem`, `removeGroundItem`, `getGroundItems`, `getInventory/setInventory`, `advanceTick`, `getSnapshot()`.
- `src/types.ts` — data-интерфейсы с `readonly`-полями; `PlayerData`; `ActiveEffect` мутабелен внутри, наружу — только копии.
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
- Инициализация объекта в ctor (например `GameFactory.world` как `readonly`-поле) — нарушение правила «ctor = только ссылки на сервисы»; мир создаётся методом `createGameWorld()`.
