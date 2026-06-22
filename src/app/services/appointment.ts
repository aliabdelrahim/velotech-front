import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AppointmentDetailsDto {
  appointmentId: number;
  userId: number;
  userName: string;
  storeId: number;
  storeName: string;
  productId?: number | null;
  productName: string;
  serviceType: string;
  scheduledAt: string;
  status: string;
  notes?: string | null;
}

export interface CreateAppointmentDto {
  userId: number;
  storeId: number;
  productId?: number | null;
  serviceType: string;
  scheduledAt: string;
  notes?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/appointments`;

  /** Mes rendez-vous (utilisateur authentifie). */
  getMyAppointments(): Observable<AppointmentDetailsDto[]> {
    return this.http.get<AppointmentDetailsDto[]>(`${this.apiUrl}/me`);
  }

  getById(id: number): Observable<AppointmentDetailsDto> {
    return this.http.get<AppointmentDetailsDto>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateAppointmentDto): Observable<AppointmentDetailsDto> {
    return this.http.post<AppointmentDetailsDto>(this.apiUrl, dto);
  }

  cancel(id: number, reason?: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/${id}/cancel`, { reason });
  }
}
