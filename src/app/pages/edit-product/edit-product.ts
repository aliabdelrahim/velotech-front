import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ProductService,
  CreateProductDto,
  ProductStoreStockDto,
  parseImageUrls,
} from '../../services/product';
import { StoreService, StoreDetailsDto } from '../../services/store';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

interface StoreStockRow {
  storeId: number;
  storeName: string;
  selected: boolean;
  stockSale: number;
  stockRental: number;
}

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './edit-product.html',
  styleUrl: './edit-product.scss',
})
export class EditProductComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private storeService = inject(StoreService);
  private router = inject(Router);

  productId = signal<number>(0);
  model = signal<CreateProductDto>({
    name: '',
    type: 'Bike',
    priceSale: 0,
    priceRental: null,
    isRentable: false,
    imageUrls: '',
  });

  /** Lignes magasin + stock pre-remplies depuis le produit charge. */
  storeRows = signal<StoreStockRow[]>([]);

  isLoading = signal(false);
  loadingProduct = signal(true);
  errorMessage = signal<string>('');

  parsedImages() {
    return parseImageUrls(this.model().imageUrls);
  }

  ngOnInit(): void {
    this.productId.set(Number(this.route.snapshot.paramMap.get('id')));
    this.loadProductAndStores();
  }

  /**
   * Charge en parallele le produit (avec StoreStocks existants)
   * et la liste de tous les magasins, puis fusionne les deux :
   * chaque magasin devient une ligne cochee ou non.
   */
  private loadProductAndStores(): void {
    this.loadingProduct.set(true);
    forkJoin({
      product: this.productService.getProductById(this.productId()),
      stores: this.storeService.getAll(),
    }).subscribe({
      next: ({ product, stores }) => {
        this.model.set({
          name: product.name,
          type: product.type,
          priceSale: product.priceSale,
          priceRental: product.priceRental,
          isRentable: product.isRentable,
          imageUrls: product.imageUrls ?? '',
        });

        // Fusion : chaque magasin est une ligne, cochee si deja attribue
        const existingStocks: ProductStoreStockDto[] = product.storeStocks ?? [];
        const rows: StoreStockRow[] = stores.map((s: StoreDetailsDto) => {
          const existing = existingStocks.find((es) => es.storeId === s.id);
          return {
            storeId: s.id,
            storeName: s.name,
            selected: !!existing,
            stockSale: existing?.stockSale ?? 0,
            stockRental: existing?.stockRental ?? 0,
          };
        });
        this.storeRows.set(rows);

        this.loadingProduct.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger le produit.');
        this.loadingProduct.set(false);
      },
    });
  }

  set<K extends keyof CreateProductDto>(key: K, value: CreateProductDto[K]): void {
    this.model.update((m) => ({ ...m, [key]: value }));
  }

  setStoreRow(storeId: number, patch: Partial<StoreStockRow>): void {
    this.storeRows.update((rows) =>
      rows.map((r) => (r.storeId === storeId ? { ...r, ...patch } : r))
    );
  }

  onRentableChange(): void {
    const m = this.model();
    if (!m.isRentable) {
      this.set('priceRental', null);
      this.storeRows.update((rows) =>
        rows.map((r) => ({ ...r, stockRental: 0 }))
      );
    }
    if (m.isRentable && m.type !== 'Bike') {
      this.set('type', 'Bike');
    }
  }

  onTypeChange(): void {
    const m = this.model();
    if (m.type !== 'Bike') {
      this.set('isRentable', false);
      this.set('priceRental', null);
      this.storeRows.update((rows) =>
        rows.map((r) => ({ ...r, stockRental: 0 }))
      );
    }
  }

  onSubmit(): void {
    this.errorMessage.set('');
    this.isLoading.set(true);

    const m = this.model();
    const storeStocks: ProductStoreStockDto[] = this.storeRows()
      .filter((r) => r.selected)
      .map((r) => ({
        storeId: r.storeId,
        stockSale: Math.max(0, r.stockSale || 0),
        stockRental: m.isRentable ? Math.max(0, r.stockRental || 0) : 0,
      }));

    const dto: CreateProductDto = {
      ...m,
      priceRental: m.isRentable ? m.priceRental : null,
      storeStocks,
    };

    this.productService.updateProduct(this.productId(), dto).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigateByUrl('/back-office/products');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error || 'Impossible de modifier le produit.');
      },
    });
  }
}
