import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RepairDetailsDto {
  repairId: number;
  storeId: number;
  storeName: string;
  productId: number;
  productName: string;
  technicianId: number;
  technicianName: string;
  appointmentId?: number | null;
  status: string; // Open / InProgress / Done / Cancelled
  diagnosis?: string | null;
  workDone?: string | null;
  cost?: number | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface CreateRepairDto {
  storeId: number;
  productId: number;
  technicianId: number;
  appointmentId?: number | null;
  diagnosis?: string | null;
  /**
   * Si true (defaut), la reparation est creee directement en "InProgress".
   * Correspond au flux "le tech prend en charge et commence tout de suite".
   */
  autoStart?: boolean;
}

export interface CompleteRepairDto {
  workDone: string;
  cost: number;
}

@Injectable({
  providedIn: 'root',
})
export class RepairService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/repairs`;

  /** Reparations assignees au technicien connecte. */
  getMine(): Observable<RepairDetailsDto[]> {
    return this.http.get<RepairDetailsDto[]>(`${this.apiUrl}/mine`);
  }

  /** Reparation liee a un RDV donne (client voit ses propres reparations). */
  getByAppointment(appointmentId: number): Observable<RepairDetailsDto> {
    return this.http.get<RepairDetailsDto>(
      `${this.apiUrl}/by-appointment/${appointmentId}`
    );
  }

  /** Toutes les reparations du magasin (admin/manager). */
  getByStore(storeId: number): Observable<RepairDetailsDto[]> {
    return this.http.get<RepairDetailsDto[]>(`${this.apiUrl}?storeId=${storeId}`);
  }

  /** Creation d'une reparation (assigne un tech). */
  create(dto: CreateRepairDto): Observable<RepairDetailsDto> {
    return this.http.post<RepairDetailsDto>(this.apiUrl, dto);
  }

  /** Demarrer une reparation (passe de Open a InProgress). */
  start(repairId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${repairId}/start`, {});
  }

  /** Cloturer avec le travail effectue et le cout final. */
  complete(repairId: number, dto: CompleteRepairDto): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${repairId}/complete`, dto);
  }
}
