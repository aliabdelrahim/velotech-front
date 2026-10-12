import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RoleDto {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/roles`;

  /** Liste des roles disponibles (admin only). */
  getAll(): Observable<RoleDto[]> {
    return this.http.get<RoleDto[]>(this.apiUrl);
  }
}
