import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  CreateProductDto,
  ProductService,
  ProductStoreStockDto,
  parseImageUrls,
} from '../../services/product';
import { StoreService, StoreDetailsDto } from '../../services/store';

/**
 * Ligne UI pour la gestion des stocks par magasin.
 * `selected` = l'admin a coche ce magasin (le produit y sera attribue).
 */
interface StoreStockRow {
  storeId: number;
  storeName: string;
  selected: boolean;
  stockSale: number;
  stockRental: number;
}

@Component({
  selector: 'app-create-product',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-product.html',
  styleUrl: './create-product.scss',
})
export class CreateProductComponent implements OnInit {
  private productService = inject(ProductService);
  private storeService = inject(StoreService);
  private router = inject(Router);

  model = signal<CreateProductDto>({
    name: '',
    type: 'Accessory',
    priceSale: 0,
    priceRental: null,
    isRentable: false,
    imageUrls: '',
  });

  /** Lignes affichees dans la section "Magasins & stocks". */
  storeRows = signal<StoreStockRow[]>([]);

  isLoading = signal(false);
  errorMessage = signal<string>('');

  parsedImages() {
    return parseImageUrls(this.model().imageUrls);
  }

  ngOnInit(): void {
    this.loadStores();
  }

  /** Charge tous les magasins pour pre-remplir la liste du formulaire. */
  private loadStores(): void {
    this.storeService.getAll().subscribe({
      next: (stores) => {
        this.storeRows.set(
          stores.map((s: StoreDetailsDto) => ({
            storeId: s.id,
            storeName: s.name,
            selected: false,
            stockSale: 0,
            stockRental: 0,
          }))
        );
      },
      error: () => {},
    });
  }

  set<K extends keyof CreateProductDto>(key: K, value: CreateProductDto[K]): void {
    this.model.update((m) => ({ ...m, [key]: value }));
  }

  /** Mise a jour d'un champ d'une ligne magasin. */
  setStoreRow(storeId: number, patch: Partial<StoreStockRow>): void {
    this.storeRows.update((rows) =>
      rows.map((r) => (r.storeId === storeId ? { ...r, ...patch } : r))
    );
  }

  onRentableChange(): void {
    const m = this.model();
    if (!m.isRentable) {
      this.set('priceRental', null);
      // Reset stocks location a 0 pour tous les magasins
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

    // Ne garde que les magasins coches, et serialise en ProductStoreStockDto
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

    this.productService.createProduct(dto).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigateByUrl('/back-office/products');
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 400) {
          this.errorMessage.set(error.error || 'Données invalides.');
        } else {
          this.errorMessage.set('Impossible de créer le produit.');
        }
      },
    });
  }
}
