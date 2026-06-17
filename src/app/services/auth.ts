import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResultDto {
  token: string;
  expiresAtUtc: string;
  userId: number;
  role: string;
  storeId: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  login(dto: LoginDto): Observable<AuthResultDto> {
    return this.http.post<AuthResultDto>(`${this.apiUrl}/login`, dto).pipe(
      tap((result) => {
        localStorage.setItem('token', result.token);
        localStorage.setItem('userId', result.userId.toString());
        localStorage.setItem('role', result.role);

        if (result.storeId !== null) {
          localStorage.setItem('storeId', result.storeId.toString());
        } else {
          localStorage.removeItem('storeId');
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  getStoreId(): string | null {
    return localStorage.getItem('storeId');
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('storeId');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}