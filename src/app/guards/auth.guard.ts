import { Router, CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from '../services/user.service';

export const authGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);

  if (userService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
