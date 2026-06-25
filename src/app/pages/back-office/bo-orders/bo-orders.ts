import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, OrderDetailsDto } from '../../../services/order';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-bo-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bo-orders.html',
  styleUrl: './bo-orders.scss',
})
export class BoOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private auth = inject(AuthService);

  orders = signal<OrderDetailsDto[]>([]);
  loading = signal(true);
  errorMsg = signal<string | null>(null);
  searchTerm = signal('');

  filtered = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    if (!q) return this.orders();
    return this.orders().filter(
      (o) =>
        String(o.orderId).includes(q) ||
        (o.customerName ?? '').toLowerCase().includes(q) ||
        (o.storeName ?? '').toLowerCase().includes(q)
    );
  });

  totalRevenue = computed(() =>
    this.filtered().reduce((sum, o) => sum + o.totalAmount, 0)
  );

  ngOnInit(): void {
    const sid = Number(this.auth.getStoreId());
    if (!sid) {
      this.errorMsg.set('Aucun magasin associe a votre compte.');
      this.loading.set(false);
      return;
    }
    this.orderService.getOrdersByStore(sid).subscribe({
      next: (list) => {
        this.orders.set(
          [...list].sort(
            (a, b) =>
              new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
          )
        );
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('Impossible de charger les commandes.');
        this.loading.set(false);
      },
    });
  }
}
