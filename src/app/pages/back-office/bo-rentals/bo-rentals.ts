import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RentalDetailsDto } from '../../../services/rental';
import { AuthService } from '../../../services/auth';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-bo-rentals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bo-rentals.html',
  styleUrl: '../bo-orders/bo-orders.scss',
})
export class BoRentalsComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  rentals = signal<RentalDetailsDto[]>([]);
  loading = signal(true);
  errorMsg = signal<string | null>(null);
  searchTerm = signal('');
  statusFilter = signal<string>('all');

  statuses = ['all', 'Confirmed', 'Active', 'Returned', 'Cancelled'];

  filtered = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();
    return this.rentals().filter((r) => {
      if (status !== 'all' && r.status !== status) return false;
      if (!q) return true;
      return (
        String(r.rentalId).includes(q) ||
        (r.userName ?? '').toLowerCase().includes(q) ||
        (r.productName ?? '').toLowerCase().includes(q)
      );
    });
  });

  ngOnInit(): void {
    const sid = Number(this.auth.getStoreId());
    if (!sid) {
      this.errorMsg.set('Aucun magasin associe a votre compte.');
      this.loading.set(false);
      return;
    }
    this.http
      .get<RentalDetailsDto[]>(`${environment.apiUrl}/rentals?storeId=${sid}`)
      .subscribe({
        next: (list) => {
          this.rentals.set(
            [...list].sort(
              (a, b) =>
                new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
            )
          );
          this.loading.set(false);
        },
        error: () => {
          this.errorMsg.set('Impossible de charger les locations.');
          this.loading.set(false);
        },
      });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'Confirmed':
      case 'Active': return 'badge-success';
      case 'Returned': return 'badge-info';
      case 'Cancelled': return 'badge-warning';
      default: return 'badge-info';
    }
  }
}
