node node_modules\typescript\bin\tsc --noEmit --project tsconfig.json
if errorlevel 1 exit /b 1
node node_modules\typescript\bin\tsc --project tsconfig.json
if errorlevel 1 exit /b 1
node dist\test\runner.js
