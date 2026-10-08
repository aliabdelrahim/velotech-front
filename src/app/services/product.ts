import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Stock d'un produit dans un magasin donne.
 * En entree (Create/Update) : StoreId + StockSale + StockRental.
 * En sortie (GET by id) : + StoreName pre-rempli pour affichage.
 */
export interface ProductStoreStockDto {
  storeId: number;
  storeName?: string | null;
  stockSale: number;
  stockRental: number;
}

export interface ProductDetailsDto {
  id: number;
  name: string;
  type: string;
  priceSale: number;
  priceRental: number | null;
  isRentable: boolean;
  /** URLs des images concatenees et separees par des virgules. */
  imageUrls?: string | null;
  /** Attribution aux magasins avec stocks (back-office). */
  storeStocks?: ProductStoreStockDto[];
}

export interface CreateProductDto {
  name: string;
  type: string;
  priceSale: number;
  priceRental: number | null;
  isRentable: boolean;
  imageUrls?: string | null;
  /** Attribution aux magasins. Si vide, le produit n'est dans aucun magasin. */
  storeStocks?: ProductStoreStockDto[];
}

/**
 * Parse le champ CSV `imageUrls` en tableau d'URLs propres.
 * - Trim de chaque URL
 * - Supprime les entrees vides
 * - Supporte separation par virgule, point-virgule ou saut de ligne
 */
export function parseImageUrls(csv?: string | null): string[] {
  if (!csv) return [];
  return csv
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Premiere image = image principale (null si aucune). */
export function firstImage(p: { imageUrls?: string | null }): string | null {
  const list = parseImageUrls(p.imageUrls);
  return list.length > 0 ? list[0] : null;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/products`;

  getProducts(type?: string): Observable<ProductDetailsDto[]> {
    if (type) {
      return this.http.get<ProductDetailsDto[]>(`${this.apiUrl}?type=${type}`);
    }

    return this.http.get<ProductDetailsDto[]>(this.apiUrl);
  }

  getProductById(id: number): Observable<ProductDetailsDto> {
    return this.http.get<ProductDetailsDto>(`${this.apiUrl}/${id}`);
  }

  createProduct(dto: CreateProductDto): Observable<ProductDetailsDto> {
    return this.http.post<ProductDetailsDto>(this.apiUrl, dto);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateProduct(id: number, dto: CreateProductDto): Observable<ProductDetailsDto> {
    return this.http.put<ProductDetailsDto>(`${this.apiUrl}/${id}`, dto);
  }
}
