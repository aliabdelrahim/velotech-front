import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreProductService, StoreProductDetailsDto } from '../../../services/store-product';
import { StoreService, StoreDetailsDto } from '../../../services/store';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-bo-stocks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bo-stocks.html',
  styleUrls: ['../bo-orders/bo-orders.scss', './bo-stocks.scss'],
})
export class BoStocksComponent implements OnInit {
  private storeProductService = inject(StoreProductService);
  private storeService = inject(StoreService);
  private auth = inject(AuthService);

  /** Liste de tous les magasins (dropdown). */
  stores = signal<StoreDetailsDto[]>([]);

  /** ID du magasin selectionne. Null tant qu'on n'a pas charge la liste. */
  selectedStoreId = signal<number | null>(null);

  /** Nom du magasin courant pour le titre. */
  selectedStoreName = computed(() => {
    const id = this.selectedStoreId();
    const s = this.stores().find((x) => x.id === id);
    return s ? s.name : '';
  });

  stocks = signal<StoreProductDetailsDto[]>([]);
  loading = signal(true);
  errorMsg = signal<string | null>(null);
  searchTerm = signal('');
  alertThreshold = 3;

  filtered = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    if (!q) return this.stocks();
    return this.stocks().filter(
      (s) =>
        s.productName.toLowerCase().includes(q) ||
        s.productType.toLowerCase().includes(q)
    );
  });

  alerts = computed(() =>
    this.stocks().filter((s) => s.stockSale <= this.alertThreshold).length
  );

  ngOnInit(): void {
    this.storeService.getAll().subscribe({
      next: (list) => {
        this.stores.set(list);
        if (list.length === 0) {
          this.errorMsg.set('Aucun magasin disponible.');
          this.loading.set(false);
          return;
        }
        // Pre-selection : magasin du user connecte si valide, sinon le 1er
        const userStoreId = Number(this.auth.getStoreId());
        const preselect =
          userStoreId && list.some((s) => s.id === userStoreId)
            ? userStoreId
            : list[0].id;
        this.onStoreChange(preselect);
      },
      error: () => {
        this.errorMsg.set('Impossible de charger les magasins.');
        this.loading.set(false);
      },
    });
  }

  /** Appelee quand l'utilisateur change de magasin dans le dropdown. */
  onStoreChange(storeId: number): void {
    this.selectedStoreId.set(storeId);
    this.loadStocks(storeId);
  }

  private loadStocks(storeId: number): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.storeProductService.getByStore(storeId).subscribe({
      next: (list) => {
        this.stocks.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('Impossible de charger les stocks.');
        this.loading.set(false);
      },
    });
  }

  updateStock(sp: StoreProductDetailsDto, field: 'stockSale' | 'stockRental', delta: number): void {
    const newValue = Math.max(0, sp[field] + delta);
    const updated = { ...sp, [field]: newValue };
    this.storeProductService
      .upsert({
        storeId: sp.storeId,
        productId: sp.productId,
        stockSale: updated.stockSale,
        stockRental: updated.stockRental,
      })
      .subscribe({
        next: () => {
          this.stocks.update((list) =>
            list.map((x) =>
              x.productId === sp.productId && x.storeId === sp.storeId
                ? updated
                : x
            )
          );
        },
        error: () => alert('Erreur de mise a jour.'),
      });
  }
}
