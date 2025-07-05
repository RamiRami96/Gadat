import { CanDeactivateFn } from '@angular/router';

export interface CanDeactivateComponent {
  canDeactivate(): boolean | Promise<boolean>;
}

export const canDeactivateGuard: CanDeactivateFn<CanDeactivateComponent> = component => {
  return component.canDeactivate ? component.canDeactivate() : true;
};
