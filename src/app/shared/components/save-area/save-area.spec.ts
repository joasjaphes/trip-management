import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveArea } from './save-area';

describe('SaveArea', () => {
  let component: SaveArea;
  let fixture: ComponentFixture<SaveArea>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaveArea]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaveArea);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
