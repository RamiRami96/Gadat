import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HabitService } from '../services/habit.service';

export const habitExistsGuard: CanActivateFn = route => {
  const habitService = inject(HabitService);
  const router = inject(Router);

  const habitId = route.paramMap.get('id');

  if (habitId && habitService.getHabit(habitId)) {
    return true;
  } else {
    router.navigate(['/habits']);
    return false;
  }
};
