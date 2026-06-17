import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CreateOrderItemDto {
  productId: number;
  quantity: number;
}

export interface CreateOrderDto {
  storeId: number;
  userId: number;
  items: CreateOrderItemDto[];
}

export interface OrderItemDto {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderDetailsDto {
  orderId: number;
  orderDate: string;
  totalAmount: number;
  storeName: string;
  customerName: string;
  items: OrderItemDto[];
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/orders`;

  private getHeaders() {
    const token = localStorage.getItem('token');

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  getOrdersByStore(storeId: number): Observable<OrderDetailsDto[]> {
    return this.http.get<OrderDetailsDto[]>(
      `${this.apiUrl}/store/${storeId}`,
      { headers: this.getHeaders() }
    );
  }

  createOrder(order: CreateOrderDto): Observable<OrderDetailsDto> {
    return this.http.post<OrderDetailsDto>(
      this.apiUrl,
      order,
      { headers: this.getHeaders() }
    );
  }

  /** Recupere les commandes du user connecte (necessite endpoint /user/me). */
  getMyOrders(): Observable<OrderDetailsDto[]> {
    return this.http.get<OrderDetailsDto[]>(
      `${this.apiUrl}/me`,
      { headers: this.getHeaders() }
    );
  }
}