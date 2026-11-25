/**
 * Loss and charge formulas for litres (fuel) trips, shared by the invoice and
 * the trip detail screen. Quantities are in litres; money is in the trip's
 * currency (USD on invoices).
 *
 *   Loss@20C          = Loaded@20C − Offloaded@20C
 *   Allowable loss    = cargo type's allowable-loss % × Amount Loaded
 *   Net loss          = Loss − Allowable loss (never below 0)
 *   Chargeable loss   = Net loss ÷ 1000 × price per unit
 *   Total             = Loaded@20C × Rate ÷ 1000 − Chargeable loss
 */
export interface LossTrip {
  /** Amount Loaded (litres). */
  cargoQuantity?: number | null;
  /** Loaded @20C (litres). */
  loadedQuantity?: number | null;
  /** Offloaded @20C (litres). */
  offloadedQuantity?: number | null;
  /** Transport rate per 1,000 litres. */
  ratePerUnit?: number | null;
  /** Product price per 1,000 litres, recorded when the trip is completed. */
  pricePerUnit?: number | null;
  revenue?: number | null;
  income?: number | null;
  /** `allowableLoss` is a percentage of the Amount Loaded (e.g. 0.3 for AGO, 0.5 for petrol). */
  cargoType?: { allowableLoss?: number | null } | null;
}

const num = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/** Loss@20C = Loaded@20C − Offloaded@20C. Null until both quantities are recorded. */
export function tripLoss(trip: LossTrip | null | undefined): number | null {
  const loaded = num(trip?.loadedQuantity);
  const offloaded = num(trip?.offloadedQuantity);
  if (!loaded || !offloaded) return null;
  return loaded - offloaded;
}

/** Allowable loss (litres) = cargo type's allowable-loss % × Amount Loaded (Loaded@20C if Amount Loaded is missing). */
export function tripAllowableLoss(trip: LossTrip | null | undefined): number {
  const percent = num(trip?.cargoType?.allowableLoss) ?? 0;
  const base = num(trip?.cargoQuantity) || num(trip?.loadedQuantity) || 0;
  return (percent / 100) * base;
}

/** Net loss = Loss − Allowable loss, never below 0. Null until the loss is known. */
export function tripNetLoss(trip: LossTrip | null | undefined): number | null {
  const loss = tripLoss(trip);
  if (loss === null) return null;
  return Math.max(0, loss - tripAllowableLoss(trip));
}

/** Chargeable loss = Net loss ÷ 1000 × price per unit. Null until a price per unit is recorded. */
export function tripChargeableLoss(trip: LossTrip | null | undefined): number | null {
  const netLoss = tripNetLoss(trip);
  const price = num(trip?.pricePerUnit);
  if (netLoss === null || price === null) return null;
  return (netLoss / 1000) * price;
}

/**
 * Total = Loaded@20C × Rate ÷ 1000 − Chargeable loss. Falls back to the
 * recorded income/revenue when the rate or loaded quantity is missing.
 */
export function tripTotal(trip: LossTrip | null | undefined): number {
  if (!trip) return 0;
  const loaded = num(trip.loadedQuantity);
  const rate = num(trip.ratePerUnit);
  const base = loaded && rate ? (loaded * rate) / 1000 : num(trip.income) ?? num(trip.revenue) ?? 0;
  return base - (tripChargeableLoss(trip) ?? 0);
}
