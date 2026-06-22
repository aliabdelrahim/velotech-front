import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StoreDetailsDto {
  id: number;
  name: string;
  address: string;
}

@Injectable({
  providedIn: 'root',
})
export class StoreService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/stores`;

  getAll(): Observable<StoreDetailsDto[]> {
    return this.http.get<StoreDetailsDto[]>(this.apiUrl);
  }

  getById(id: number): Observable<StoreDetailsDto> {
    return this.http.get<StoreDetailsDto>(`${this.apiUrl}/${id}`);
  }
}
