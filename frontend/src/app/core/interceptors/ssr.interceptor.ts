import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { environment } from '../../../environments/environment';

export const ssrInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  
  if (isPlatformServer(platformId)) {
    const isRelative = !req.url.startsWith('http://') && !req.url.startsWith('https://');
    if (isRelative) {
      const slash = req.url.startsWith('/') ? '' : '/';
      const serverUrl = `${environment.backendUrl}${slash}${req.url}`;
      const clonedReq = req.clone({ url: serverUrl });
      return next(clonedReq);
    }
  }
  
  return next(req);
};
