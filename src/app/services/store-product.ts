import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StoreProductDetailsDto {
  id: number;
  storeId: number;
  storeName: string;
  productId: number;
  productName: string;
  productType: string;
  stockSale: number;
  stockRental: number;
  priceSale: number;
}

export interface UpsertStoreProductDto {
  storeId: number;
  productId: number;
  stockSale: number;
  stockRental: number;
}

@Injectable({
  providedIn: 'root',
})
export class StoreProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/StoreProducts`;

  getByStore(storeId: number) {
    return this.http.get<StoreProductDetailsDto[]>(
      `${this.apiUrl}/store/${storeId}`
    );
  }
  upsert(dto: UpsertStoreProductDto) {
    return this.http.post<StoreProductDetailsDto>(this.apiUrl, dto);
  }
  delete(storeId: number, productId: number) {
  return this.http.delete(
    `${this.apiUrl}/store/${storeId}/product/${productId}`
  );
}
}