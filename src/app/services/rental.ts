import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RentalDetailsDto {
  rentalId: number;
  userId: number;
  userName: string;
  storeId: number;
  storeName: string;
  productId: number;
  productName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
}

export interface CreateRentalDto {
  userId: number;
  storeId: number;
  productId: number;
  startDate: string;
  endDate: string;
}

@Injectable({
  providedIn: 'root',
})
export class RentalService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/rentals`;

  /** Mes locations (utilisateur authentifie). */
  getMyRentals(): Observable<RentalDetailsDto[]> {
    return this.http.get<RentalDetailsDto[]>(`${this.apiUrl}/me`);
  }

  getById(id: number): Observable<RentalDetailsDto> {
    return this.http.get<RentalDetailsDto>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateRentalDto): Observable<RentalDetailsDto> {
    return this.http.post<RentalDetailsDto>(this.apiUrl, dto);
  }

  cancel(id: number, reason?: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/${id}/cancel`, { reason });
  }
}
