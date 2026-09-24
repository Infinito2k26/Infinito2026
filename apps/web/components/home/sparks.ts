/**
 * Sparks thrown into the page-wide ember layer (AshEmbers), if it's switched
 * on. A window event, so whatever throws them — a burning fight bill, say —
 * needn't know whether the layer is there.
 */

export type SparkDetail = {
  /** Viewport coordinates, px. */
  x: number;
  y: number;
  /** How many. Default 1. */
  n?: number;
  /** Launch speed multiplier. Default 0.7. */
  power?: number;
};

export const SPARK_EVENT = "embers:spark";

export function throwSparks(detail: SparkDetail) {
  window.dispatchEvent(new CustomEvent<SparkDetail>(SPARK_EVENT, { detail }));
}
