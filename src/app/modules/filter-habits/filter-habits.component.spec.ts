import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterHabitsComponent } from './filter-habits.component';

describe('FilterHabitsComponent', () => {
  let component: FilterHabitsComponent;
  let fixture: ComponentFixture<FilterHabitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterHabitsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterHabitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
