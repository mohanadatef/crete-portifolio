import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('auth_token');
  }

  const authReq = token 
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
        }
        router.navigate(['/admin/login']);
      } else if (error.status === 403) {
        // You can replace this with a proper Toast service call later
        console.error('Access Denied: You do not have permission.');
        alert('Access Denied: You do not have permission to perform this action.');
      } else if (error.status === 500) {
         console.error('Server Error:', error.message);
         alert('Server Error. Please try again later.');
      }
      return throwError(() => error);
    })
  );
};
