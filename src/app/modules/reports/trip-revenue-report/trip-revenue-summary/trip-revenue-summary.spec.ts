import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripRevenueSummary } from './trip-revenue-summary';

describe('TripRevenueSummary', () => {
  let component: TripRevenueSummary;
  let fixture: ComponentFixture<TripRevenueSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripRevenueSummary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripRevenueSummary);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
