import type { IItem } from "./IItem.js";

export class Flare implements IItem {
  readonly type = "flare";
  readonly stackable = true;

  constructor() {}
}
