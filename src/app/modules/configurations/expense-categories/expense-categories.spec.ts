import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpenseCategories } from './expense-categories';

describe('ExpenseCategories', () => {
  let component: ExpenseCategories;
  let fixture: ComponentFixture<ExpenseCategories>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseCategories]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpenseCategories);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
