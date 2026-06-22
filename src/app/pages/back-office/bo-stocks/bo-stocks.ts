import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreProductService, StoreProductDetailsDto } from '../../../services/store-product';
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
  private auth = inject(AuthService);

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
    const sid = Number(this.auth.getStoreId());
    if (!sid) {
      this.errorMsg.set('Aucun magasin associe a votre compte.');
      this.loading.set(false);
      return;
    }
    this.storeProductService.getByStore(sid).subscribe({
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
