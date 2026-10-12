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

/** Cible d'un paiement en ligne Stripe (exactement un identifiant). */
export interface CheckoutTarget {
  orderId?: number;
  rentalId?: number;
  repairId?: number;
}

export interface CheckoutSessionDto {
  paymentId: number;
  sessionId: string;
  url: string;
}

export interface CheckoutStatusDto {
  paymentId: number;
  paymentType: PaymentType;
  status: PaymentStatus;
  amount: number;
  orderId?: number | null;
  rentalId?: number | null;
  repairId?: number | null;
}

/**
 * Service dedie a la gestion des paiements.
 * Les clients paient en ligne via Stripe Checkout : le back cree une session,
 * le front redirige vers la page de paiement Stripe, puis Stripe renvoie sur
 * /payment/success ou /payment/cancel. Aucune donnee carte ne passe par Velotech.
 * La table Payments trace toutes les transactions (commandes, locations,
 * reparations) pour l'historique et la comptabilite.
 */
@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/payments`;

  /**
   * Cree (ou reprend) une session Stripe Checkout et renvoie l'URL de paiement.
   * Le montant est calcule par le back a partir de la base, jamais par le front.
   */
  createCheckoutSession(target: CheckoutTarget, locale?: string): Observable<CheckoutSessionDto> {
    return this.http.post<CheckoutSessionDto>(`${this.apiUrl}/checkout-session`, { ...target, locale });
  }

  /** Statut d'un paiement Stripe (page de retour /payment/success). */
  getCheckoutStatus(sessionId: string): Observable<CheckoutStatusDto> {
    return this.http.get<CheckoutStatusDto>(
      `${this.apiUrl}/checkout-session/${encodeURIComponent(sessionId)}`
    );
  }

  /** Abandon du paiement (retour /payment/cancel) : libere le stock reserve. */
  cancelCheckout(paymentId: number): Observable<CheckoutStatusDto> {
    return this.http.post<CheckoutStatusDto>(`${this.apiUrl}/${paymentId}/cancel`, {});
  }

  /** Encaissement en magasin saisi par le staff (Admin / Manager). */
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
