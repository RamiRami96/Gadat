import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateHabbitComponent } from './create-habit.component';

describe('CreateHabbitComponent', () => {
  let component: CreateHabbitComponent;
  let fixture: ComponentFixture<CreateHabbitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateHabbitComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateHabbitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
