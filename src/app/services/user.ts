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
  isDeleted?: boolean;
  /** Date UTC de suppression du compte (null si actif). */
  deletedAt?: string | null;
}

export interface UpdateProfileDto {
  name: string;
  email: string;
  currentPassword?: string | null;
  newPassword?: string | null;
}

/** DTO utilise par l'admin pour creer un compte (n'importe quel role). */
export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  roleId: number;
  storeId?: number | null;
}

/** DTO utilise par l'admin pour modifier n'importe quel user. */
export interface UpdateUserDto {
  name: string;
  email: string;
  roleId: number;
  storeId?: number | null;
  /** Si fourni, remplace le mdp (reset par admin). */
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
    return this.http.request<{ message: string }>('DELETE', `${this.apiUrl}/me`, {
      body: { password },
    });
  }

  // ========== Endpoints admin ==========

  /** Liste de tous les utilisateurs (admin only). */
  getAll(): Observable<UserDetailsDto[]> {
    return this.http.get<UserDetailsDto[]>(this.apiUrl);
  }

  /** Detail d'un user par id (admin only). */
  getById(id: number): Observable<UserDetailsDto> {
    return this.http.get<UserDetailsDto>(`${this.apiUrl}/${id}`);
  }

  /** Creation d'un user par l'admin (role et mdp specifies). */
  create(dto: CreateUserDto): Observable<UserDetailsDto> {
    return this.http.post<UserDetailsDto>(this.apiUrl, dto);
  }

  /** Modification d'un user par l'admin (optionnel : reset mdp). */
  update(id: number, dto: UpdateUserDto): Observable<UserDetailsDto> {
    return this.http.put<UserDetailsDto>(`${this.apiUrl}/${id}`, dto);
  }

  /** Suppression (soft + anonymisation) d'un user par l'admin. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
