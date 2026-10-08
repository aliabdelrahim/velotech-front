import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Entree catalogue : produit avec stock dans un magasin donne.
 * Retourne par GET /api/catalog/store/{storeId}
 */
export interface ProductCatalogDto {
  productId: number;
  name: string;
  type: string;
  priceSale: number;
  priceRental: number | null;
  isRentable: boolean;
  stockSale: number;
  stockRental: number;
  imageUrls?: string | null;
}

/**
 * Disponibilite d'un produit dans un magasin.
 * Retourne par GET /api/catalog/product/{productId}/stores
 */
export interface StoreAvailabilityDto {
  storeId: number;
  storeName: string;
  address: string;
  stockSale: number;
  stockRental: number;
}

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/catalog`;

  /** Catalogue filtre par magasin (public, pas besoin de token). */
  getByStore(storeId: number): Observable<ProductCatalogDto[]> {
    return this.http.get<ProductCatalogDto[]>(`${this.apiUrl}/store/${storeId}`);
  }

  /** Liste les magasins ou un produit est disponible (public). */
  getStoresForProduct(productId: number): Observable<StoreAvailabilityDto[]> {
    return this.http.get<StoreAvailabilityDto[]>(
      `${this.apiUrl}/product/${productId}/stores`
    );
  }
}
