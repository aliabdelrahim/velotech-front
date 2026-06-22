import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserDetailsDto {
  id: number;
  name: string;
  email: string;
  roleId: number;
  roleName: string;
  storeId: number;
  storeName: string;
}

export interface UpdateProfileDto {
  name: string;
  email: string;
  currentPassword?: string | null;
  newPassword?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  /** Profil de l'utilisateur authentifie. */
  getMe(): Observable<UserDetailsDto> {
    return this.http.get<UserDetailsDto>(`${this.apiUrl}/me`);
  }

  /** Mise a jour du profil (et optionnellement du mot de passe). */
  updateMe(dto: UpdateProfileDto): Observable<UserDetailsDto> {
    return this.http.put<UserDetailsDto>(`${this.apiUrl}/me`, dto);
  }
}
