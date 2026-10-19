import { smoke } from "./scenarios/smoke.js";
import { dropPickup } from "./scenarios/drop-pickup.js";
import { groundTimeout } from "./scenarios/ground-timeout.js";
import { useEffect } from "./scenarios/use-effect.js";
import { concurrentPickup } from "./scenarios/concurrent-pickup.js";

interface Scenario {
  name: string;
  run: () => Promise<void>;
}

async function main(): Promise<void> {
  const scenarios: Scenario[] = [
    smoke,
    dropPickup,
    groundTimeout,
    useEffect,
    concurrentPickup,
  ];

  let failed = 0;

  for (const scenario of scenarios) {
    try {
      await scenario.run();
      console.log(`PASS ${scenario.name}`);
    } catch (err) {
      failed += 1;
      console.error(`FAIL ${scenario.name}`);
      console.error(err);
    }
  }

  if (failed > 0) {
    console.error(`${failed} of ${scenarios.length} scenario(s) failed`);
    process.exit(1);
  }

  console.log(`All ${scenarios.length} scenario(s) passed`);
}

main();
