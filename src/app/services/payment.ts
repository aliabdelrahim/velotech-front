import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** Type de cible pour un paiement (polymorphe : commande, location ou reparation). */
export type PaymentType = 'Order' | 'Rental' | 'Repair';

/** Statut du paiement retourne par l'API. */
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export interface CreatePaymentDto {
  userId: number;
  amount: number;
  orderId?: number;
  rentalId?: number;
  repairId?: number;
}

export interface PaymentDetailsDto {
  paymentId: number;
  userId: number;
  userName: string;
  paymentType: PaymentType;
  amount: number;
  status: PaymentStatus;
  orderId?: number | null;
  rentalId?: number | null;
  repairId?: number | null;
  createdAt: string;
}

/**
 * Service dedie a la gestion des paiements.
 * Actuellement, le back simule le traitement (aucun PSP branche) :
 * chaque paiement cree est immediatement marque comme "Paid".
 * La table Payments trace ainsi toutes les transactions (commandes,
 * locations, reparations) pour l'historique et la comptabilite.
 */
@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/payments`;

  /** Cree un paiement pour une commande, une location ou une reparation. */
  create(dto: CreatePaymentDto): Observable<PaymentDetailsDto> {
    return this.http.post<PaymentDetailsDto>(this.apiUrl, dto);
  }

  /** Recupere un paiement par son identifiant. */
  getById(id: number): Observable<PaymentDetailsDto> {
    return this.http.get<PaymentDetailsDto>(`${this.apiUrl}/${id}`);
  }

  /** Liste les paiements, filtrable par utilisateur et/ou type. */
  list(filters?: { userId?: number; type?: PaymentType }): Observable<PaymentDetailsDto[]> {
    let params = new HttpParams();
    if (filters?.userId !== undefined) params = params.set('userId', String(filters.userId));
    if (filters?.type) params = params.set('type', filters.type);
    return this.http.get<PaymentDetailsDto[]>(this.apiUrl, { params });
  }
}
