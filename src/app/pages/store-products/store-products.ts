import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreProductDetailsDto, StoreProductService } from '../../services/store-product';
import { ProductService, ProductDetailsDto } from '../../services/product';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-store-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './store-products.html',
  styleUrl: './store-products.scss',
})
export class StoreProductsComponent implements OnInit {
  private storeProductService = inject(StoreProductService);
  private cdr = inject(ChangeDetectorRef);
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  storeId = Number(this.authService.getStoreId()) || 1;

  products: ProductDetailsDto[] = [];
  storeName = '';

  form = {
    storeId: Number(this.storeId),
    productId: 0,
    stockSale: 0,
    stockRental: 0
  };

  saveStock(): void {
    this.storeProductService.upsert(this.form).subscribe({
      next: () => {
        this.loadStocks();
        this.form = {
          storeId: Number(this.storeId),
          productId: 0,
          stockSale: 0,
          stockRental: 0
        };
      },
      error: (err) => {
        console.log('ERREUR SAVE STOCK =', err);
        this.errorMessage = 'Impossible d’enregistrer le stock.';
      },
    });
  }

  storeProducts: StoreProductDetailsDto[] = [];
  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadStocks();

    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
      },
    });
  }

  loadStocks(): void {
    this.storeProductService.getByStore(this.storeId).subscribe({
      next: (data) => {
        this.storeProducts = data;

        if (data.length > 0) {
          this.storeName = data[0].storeName;
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log('ERROR =', err);
        this.errorMessage = 'Impossible de charger les stocks.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
  edit(item: StoreProductDetailsDto): void {
    this.form = {
      storeId: item.storeId,
      productId: item.productId,
      stockSale: item.stockSale,
      stockRental: item.stockRental
    };
  }
  delete(item: StoreProductDetailsDto): void {
    if (!confirm('Tu veux vraiment supprimer ce stock ?')) return;

    this.storeProductService
      .delete(item.storeId, item.productId)
      .subscribe({
        next: () => {
          this.loadStocks();


          this.form = {
            storeId: this.storeId,
            productId: 0,
            stockSale: 0,
            stockRental: 0
          };
        },
        error: (err) => {
          console.log('ERROR DELETE =', err);
          this.errorMessage = 'Impossible de supprimer.';
        },
      });
  }
}