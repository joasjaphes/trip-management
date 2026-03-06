import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddExpenseCategory } from './add-expense-category';

describe('AddExpenseCategory', () => {
  let component: AddExpenseCategory;
  let fixture: ComponentFixture<AddExpenseCategory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddExpenseCategory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddExpenseCategory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
