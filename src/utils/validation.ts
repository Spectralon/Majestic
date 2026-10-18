import type { Vec2 } from "../types.js";

export function validatePosition(position: Vec2, width: number, height: number, label: string): Vec2 {
  if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
    throw new Error(`${label} must be a finite vector`);
  }
  if (position.x < 0 || position.x > width || position.y < 0 || position.y > height) {
    throw new Error(`${label} out of bounds: (${position.x}, ${position.y})`);
  }
  return { ...position };
}

export function validateAmount(amount: number, operation: string): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`${operation}: amount must be a positive finite number`);
  }
  return amount;
}

export function validateStat(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a non-negative finite number`);
  }
  return value;
}
