import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RentalService, RentalDetailsDto } from '../../services/rental';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

type Tab = 'all' | 'active' | 'past' | 'cancelled';

@Component({
  selector: 'app-my-rentals',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, HeaderComponent, FooterComponent],
  templateUrl: './my-rentals.html',
  styleUrl: './my-rentals.scss',
})
export class MyRentalsComponent implements OnInit {
  private rentalService = inject(RentalService);
  private i18n = inject(TranslateService);

  rentals = signal<RentalDetailsDto[]>([]);
  loading = signal(true);
  errorMsg = signal<string | null>(null);
  activeTab = signal<Tab>('all');
  cancellingId = signal<number | null>(null);

  now = new Date();

  filtered = computed(() => {
    const tab = this.activeTab();
    const items = this.rentals();
    if (tab === 'all') return items;
    if (tab === 'cancelled') return items.filter((r) => r.status === 'Cancelled');
    if (tab === 'active') {
      return items.filter((r) => {
        if (r.status === 'Cancelled') return false;
        return new Date(r.endDate) >= this.now;
      });
    }
    // past
    return items.filter((r) => {
      if (r.status === 'Cancelled') return false;
      return new Date(r.endDate) < this.now;
    });
  });

  totals = computed(() => {
    const items = this.rentals();
    return {
      all: items.length,
      active: items.filter(
        (r) => r.status !== 'Cancelled' && new Date(r.endDate) >= this.now
      ).length,
      past: items.filter(
        (r) => r.status !== 'Cancelled' && new Date(r.endDate) < this.now
      ).length,
      cancelled: items.filter((r) => r.status === 'Cancelled').length,
    };
  });

  ngOnInit(): void {
    this.loadRentals();
  }

  private loadRentals(): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.rentalService.getMyRentals().subscribe({
      next: (list) => {
        this.rentals.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set(this.i18n.instant('RENTAL.LOAD_ERROR'));
        this.loading.set(false);
      },
    });
  }

  setTab(t: Tab): void {
    this.activeTab.set(t);
  }

  daysBetween(start: string, end: string): number {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return Math.max(1, Math.round((e - s) / 86_400_000));
  }

  canCancel(r: RentalDetailsDto): boolean {
    if (r.status === 'Cancelled' || r.status === 'Returned') return false;
    return new Date(r.startDate) > this.now;
  }

  cancel(r: RentalDetailsDto): void {
    const msg = this.i18n.instant('RENTAL.CANCEL_CONFIRM', { name: r.productName });
    if (!confirm(msg)) return;
    this.cancellingId.set(r.rentalId);
    this.rentalService.cancel(r.rentalId).subscribe({
      next: () => {
        this.rentals.update((list) =>
          list.map((x) =>
            x.rentalId === r.rentalId ? { ...x, status: 'Cancelled' } : x
          )
        );
        this.cancellingId.set(null);
      },
      error: () => {
        alert(this.i18n.instant('RENTAL.CANCEL_ERROR'));
        this.cancellingId.set(null);
      },
    });
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'Confirmed': return this.i18n.instant('RENTAL.STATUS_CONFIRMED');
      case 'Active': return this.i18n.instant('RENTAL.STATUS_ACTIVE');
      case 'Returned': return this.i18n.instant('RENTAL.STATUS_RETURNED');
      case 'Cancelled': return this.i18n.instant('RENTAL.STATUS_CANCELLED');
      default: return status;
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'Confirmed': return 'badge-success';
      case 'Active': return 'badge-success';
      case 'Returned': return 'badge-info';
      case 'Cancelled': return 'badge-warning';
      default: return 'badge-info';
    }
  }
}
