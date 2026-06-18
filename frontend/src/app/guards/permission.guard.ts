import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  const requiredPermission = route.data?.['permission'];
  
  if (!requiredPermission) {
    return true; // if no permission is required, allow access
  }
  
  if (authService.hasPermission(requiredPermission)) {
    return true;
  }
  
  router.navigate(['/admin/dashboard']);
  return false;
};
