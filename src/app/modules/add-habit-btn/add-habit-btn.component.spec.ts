import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddHabitBtnComponent } from './add-habit-btn.component';

describe('AddHabitBtnComponent', () => {
  let component: AddHabitBtnComponent;
  let fixture: ComponentFixture<AddHabitBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddHabitBtnComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddHabitBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
