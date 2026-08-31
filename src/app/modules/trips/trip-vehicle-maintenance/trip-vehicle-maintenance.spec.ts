import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripVehicleMaintenance } from './trip-vehicle-maintenance';

describe('TripVehicleMaintenance', () => {
  let component: TripVehicleMaintenance;
  let fixture: ComponentFixture<TripVehicleMaintenance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripVehicleMaintenance]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripVehicleMaintenance);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
