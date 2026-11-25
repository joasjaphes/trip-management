import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpenseCategoryService } from '../../../services/expense-category.service';
import { FileUploadService } from '../../../services/file-upload.service';
import { TripDetail } from './trip-detail';

describe('TripDetail completion and loss breakdown', () => {
  let fixture: ComponentFixture<TripDetail>;
  let component: TripDetail;

  const litresTrip: any = {
    id: 'trip-1',
    status: 'Inprogress',
    tripDate: '2026-11-01',
    endDate: '2026-11-11',
    cargoQuantity: 39000,
    loadedQuantity: 38711.4,
    offloadedQuantity: 38500,
    ratePerUnit: 90,
    revenue: 3484.03,
    cargoType: { id: 'ago', name: 'AGO', unitOfMeasure: 'Litres', allowableLoss: 0.3 },
    expenses: [],
    vehicleMaintenance: [],
  };

  const render = async (trip: any) => {
    fixture.componentRef.setInput('trip', trip);
    fixture.componentRef.setInput('shouldComplete', true);
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripDetail],
      providers: [
        { provide: ExpenseCategoryService, useValue: { getAll: async () => {}, getById: () => undefined } },
        {
          provide: FileUploadService,
          useValue: {
            resolveFileUrl: async () => undefined,
            getFileName: () => undefined,
            uploadFile: async () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TripDetail);
    component = fixture.componentInstance;
  });

  it('asks for the price per unit when completing a litres trip', async () => {
    await render(litresTrip);

    expect(fixture.nativeElement.querySelector('input[name="pricePerUnit"]')).not.toBeNull();
  });

  it('sends the price per unit with the completed trip', async () => {
    await render(litresTrip);
    let emitted: any;
    component.complete.subscribe((trip) => (emitted = trip));

    component.pricePerUnit = 800;
    component.confirmComplete();

    expect(emitted.pricePerUnit).toBe(800);
    expect(emitted.offloadedQuantity).toBe(38500);
  });

  it('leaves the price per unit out when it is not entered', async () => {
    await render(litresTrip);
    let emitted: any;
    component.complete.subscribe((trip) => (emitted = trip));

    component.pricePerUnit = null;
    component.confirmComplete();

    expect(emitted.pricePerUnit).toBeUndefined();
  });

  it('shows the loss breakdown with the invoice formulas', async () => {
    await render({ ...litresTrip, pricePerUnit: 800 });

    expect(component.loss()).toBeCloseTo(211.4, 2);
    expect(component.allowableLoss()).toBeCloseTo(117, 2);
    expect(component.netLoss()).toBeCloseTo(94.4, 2);
    expect(component.chargeableLoss()).toBeCloseTo(75.52, 2);
    expect(component.tripTotal()).toBeCloseTo(3408.51, 2);
  });
});
