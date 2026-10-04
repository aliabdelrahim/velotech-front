import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth';

/**
 * Intercepteur JWT :
 *  1. Ajoute automatiquement le header Authorization si un token est stocke.
 *  2. En cas de 401 Unauthorized (token expire ou invalide), deconnecte
 *     l'utilisateur et le redirige vers /login — sauf pour l'endpoint
 *     /auth/login lui-meme (sinon un mauvais mot de passe declencherait
 *     une redirection trompeuse).
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = localStorage.getItem('token');
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const isLoginRequest = req.url.includes('/auth/login');
      if (err.status === 401 && !isLoginRequest) {
        auth.logout();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
