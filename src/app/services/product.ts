import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProductDetailsDto {
  id: number;
  name: string;
  type: string;
  priceSale: number;
  priceRental: number | null;
  isRentable: boolean;
}

export interface CreateProductDto {
  name: string;
  type: string;
  priceSale: number;
  priceRental: number | null;
  isRentable: boolean;
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


