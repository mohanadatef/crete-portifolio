import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const router = inject(Router);
  const token = authService.getToken();

  let clonedReq = req.clone({
    withCredentials: true
  });
  if (token) {
    clonedReq = clonedReq.clone({
      headers: clonedReq.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        toastService.error('Session expired. Please log in again.');
        router.navigate(['/admin/login']);
      } else if (error.status === 403) {
        toastService.error('Access Denied: You do not have permission.');
      } else if (error.status === 500) {
        toastService.error('An unexpected server error occurred. Please try again later.');
      }
      return throwError(() => error);
    })
  );
};
