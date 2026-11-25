import {
  tripAllowableLoss,
  tripChargeableLoss,
  tripLoss,
  tripNetLoss,
  tripTotal,
} from './trip-loss';

// Row "T 389 ERZ" from the reference invoice (Excel PDF).
const pdfRow = {
  cargoQuantity: 39000, // Amount Loaded
  loadedQuantity: 38711.4, // Loaded @20C
  offloadedQuantity: 38620.79, // Offloaded @20C
  ratePerUnit: 90, // transport rate per 1,000 L
  cargoType: { allowableLoss: 0.3 }, // AGO: 0.3 %
  revenue: 3484.03,
};

describe('trip loss formulas', () => {
  it('reproduces the reference invoice row when the loss is within the allowance', () => {
    expect(tripLoss(pdfRow)).toBeCloseTo(90.61, 2); // Loaded@20 − Offloaded@20
    expect(tripAllowableLoss(pdfRow)).toBeCloseTo(117, 2); // 0.3 % × Amount Loaded
    expect(tripNetLoss(pdfRow)).toBe(0); // within the allowance → 0, never negative
    expect(tripChargeableLoss({ ...pdfRow, pricePerUnit: 800 })).toBe(0);
    expect(tripTotal(pdfRow)).toBeCloseTo(3484.03, 2); // Loaded@20 × Rate ÷ 1000
  });

  it('charges the net loss at the price per unit and deducts it from the total', () => {
    const trip = { ...pdfRow, offloadedQuantity: 38500, pricePerUnit: 800 };

    expect(tripLoss(trip)).toBeCloseTo(211.4, 2);
    expect(tripNetLoss(trip)).toBeCloseTo(94.4, 2); // 211.40 − 117
    expect(tripChargeableLoss(trip)).toBeCloseTo(75.52, 2); // 94.40 ÷ 1000 × 800
    expect(tripTotal(trip)).toBeCloseTo(3408.51, 2); // 3,484.03 − 75.52
  });

  it('uses the petrol percentage from the cargo type', () => {
    const petrol = { ...pdfRow, cargoType: { allowableLoss: 0.5 } };

    expect(tripAllowableLoss(petrol)).toBeCloseTo(195, 2); // 0.5 % × 39,000
  });

  it('makes no loss charge until a price per unit is recorded', () => {
    const trip = { ...pdfRow, offloadedQuantity: 38500 };

    expect(tripNetLoss(trip)).toBeCloseTo(94.4, 2);
    expect(tripChargeableLoss(trip)).toBeNull();
    expect(tripTotal(trip)).toBeCloseTo(3484.03, 2);
  });

  it('treats a gain (offloaded more than loaded) as no net loss', () => {
    const trip = { ...pdfRow, offloadedQuantity: 38800, pricePerUnit: 800 };

    expect(tripLoss(trip)).toBeCloseTo(-88.6, 2);
    expect(tripNetLoss(trip)).toBe(0);
    expect(tripChargeableLoss(trip)).toBe(0);
  });

  it('has no loss figures until the offloaded quantity is recorded', () => {
    const trip = { ...pdfRow, offloadedQuantity: undefined, pricePerUnit: 800 };

    expect(tripLoss(trip)).toBeNull();
    expect(tripNetLoss(trip)).toBeNull();
    expect(tripChargeableLoss(trip)).toBeNull();
    expect(tripTotal(trip)).toBeCloseTo(3484.03, 2);
  });

  it('falls back to the loaded quantity for the allowance when Amount Loaded is missing', () => {
    expect(tripAllowableLoss({ ...pdfRow, cargoQuantity: undefined })).toBeCloseTo(116.13, 2);
  });

  it('has no allowance when the cargo type has no percentage', () => {
    expect(tripAllowableLoss({ ...pdfRow, cargoType: undefined })).toBe(0);
  });

  it('falls back to the recorded revenue when the rate is missing', () => {
    expect(tripTotal({ ...pdfRow, ratePerUnit: undefined, revenue: 3500 })).toBe(3500);
  });
});
