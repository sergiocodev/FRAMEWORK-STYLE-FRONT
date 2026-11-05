import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStateService } from '../services/auth-state.service';
import { environment } from '../../../environments/environment';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authState = inject(AuthStateService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isBackendUrl = req.url.startsWith(environment.apiUrl) || 
                           req.url.startsWith('http://localhost') ||
                           req.url.startsWith('http://127.0.0.1') ||
                           req.url.startsWith('/api') ||
                           (!req.url.startsWith('http://') && !req.url.startsWith('https://'));

      if (error.status === 401 && isBackendUrl) {
        // Token expirado o no autorizado en nuestra propia API
        authState.clearState();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
