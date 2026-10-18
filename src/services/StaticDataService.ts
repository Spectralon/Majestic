export class StaticDataService {
  readonly config = {
    GROUND_LIFETIME_TICKS: 600,
    TICK_INTERVAL_MS: 100,
    WORLD_WIDTH: 800,
    WORLD_HEIGHT: 600,

    STORAGE_DELAY_MS: 50,
    HTTP_PORT: 3000,
    WS_PORT: 3001,

    PLAYER: {
      pickupRadius: 50,
      speed: 2,
      maxHP: 100,
      maxArmor: 100,
      spawnHP: 50,
      spawnArmor: 50,
    },

    ITEMS: {
      medkit: {
        color: "#ff4444",
        radius: 8,
        addHP: 100,
      },
      armor: {
        color: "#4488ff",
        radius: 8,
        addArmor: 30,
      },
      bandage: {
        color: "#44ff44",
        radius: 8,
        healPerTick: 5,
        duration: 4,
      },
      flare: {
        color: "#ffaa00",
        radius: 8,
        highlightTicks: 30,
      },
    },
  } as const;
}
