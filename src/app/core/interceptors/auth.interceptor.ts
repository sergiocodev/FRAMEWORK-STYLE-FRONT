import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');
  
  // Solo inyectar el header Authorization a peticiones dirigidas a nuestro backend local/propio.
  // Enviar Authorization a APIs públicas de terceros (como Iconify) provoca error CORS preflight
  // y fuga insegura de tokens de sesión.
  const isBackendUrl = req.url.startsWith(environment.apiUrl) || 
                       req.url.startsWith('http://localhost') ||
                       req.url.startsWith('http://127.0.0.1') ||
                       req.url.startsWith('/api') ||
                       (!req.url.startsWith('http://') && !req.url.startsWith('https://'));

  if (token && isBackendUrl) {
    const clonedReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(clonedReq);
  }
  
  return next(req);
};
