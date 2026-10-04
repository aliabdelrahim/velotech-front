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

  /**
   * Suppression du compte client authentifie (desinscription).
   * Le mot de passe est requis cote back pour verifier l'identite.
   * Les donnees personnelles sont anonymisees, l'historique conserve.
   */
  deleteMyAccount(password: string): Observable<{ message: string }> {
    // DELETE avec body : on utilise la propriete `body` de HttpClient.
    return this.http.request<{ message: string }>('DELETE', `${this.apiUrl}/me`, {
      body: { password },
    });
  }
}
