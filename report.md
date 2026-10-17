# report.md — база знаний (факты и грабли)

## Факты кода

- В коммиты не попадают комментарии и TODO-маркеры (пользователь зачищает). Код пишется чистым, без комментариев.
- Стуб метода с типом возврата: `throw new Error("Not implemented")` — это код, не комментарий; в коммит попадает.
- `src/items/index.ts` — каталог предметов: одна строка `import "./<name>.js";` на предмет (саморегистрация при загрузке модуля). Файл обязан существовать, иначе `import "./items/index.js"` в `src/entry.ts` не резолвится.
- Коммиты делает пользователь; координатор только готовит файлы и верифицирует.

## Инкапсуляция (правила, заданные пользователем)

- Владелец состояния валидирует свои поля; предметы/сервисы НИКОГДА не клампят и не валидируют числа — только вызывают методы владельца (Medkit: `player.addHP(config.ITEMS.medkit.addHP)`).
- `src/core/player.ts` — класс `Player`: private `_hp/_armor/_position/_target/_effects`, публичные геттеры readonly (возвращают копии). Мутации: `addHP`/`addArmor` (amount — finite > 0, cap `Math.min` по `config.PLAYER.maxHP/maxArmor`), `setTarget` (out-of-bounds → throw), `moveBy` (clamp в мир), `addEffect` (дубль type → throw), `getEffect`, `removeEffect`, `advanceEffects`, `toData(): PlayerData`.
- `WorldState` — private Map + getter `tick`; `addPlayer(id, position): Player` — фабрика; `getPlayers()`; `getSnapshot()` через `player.toData()`.
- `src/types.ts` — data-интерфейсы с `readonly`-полями; `PlayerData` вместо старых `Player`/`PlayerStats`; `ActiveEffect` мутабелен внутри, наружу — только копии.

## Окружение

- Node v24: `C:\Program Files\nodejs\node.exe`; `.cmd` не спавнить.
- tsc: `node.exe node_modules\typescript\bin\tsc --noEmit --project tsconfig.json`.
- Тесты: `node.exe node_modules\tsx\dist\cli.mjs src\test\runner.ts` (совпадает с `npm test`).
- Spawn tsc/node/npm из DSH-песочницы требует `danger-full-access` (SetNamedSecurityInfoW Win32 5).
- Subagent не запускает исполняемые файлы — все команды выполняет координатор.

## Pitfalls & dead ends

- Пустое тело метода с типом возврата (не void/any) → TS2355. Лечится `throw new Error(...)`.
- Файл `items/index.ts` из одних комментариев выпал из коммита пользователя, а import в entry без файла ломает сборку — файл обязан существовать пустым.
