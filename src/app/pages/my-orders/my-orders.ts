import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService, OrderDetailsDto } from '../../services/order';
import { AuthService } from '../../services/auth';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.scss',
})
export class MyOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private auth = inject(AuthService);

  orders = signal<OrderDetailsDto[]>([]);
  loading = signal(true);
  errorMsg = signal<string | null>(null);
  expanded = signal<Set<number>>(new Set());

  totalSpent = computed(() =>
    this.orders().reduce((sum, o) => sum + o.totalAmount, 0)
  );

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.errorMsg.set(null);

    // Endpoint /me a creer cote API. Fallback : commandes du magasin du user.
    this.orderService.getMyOrders().subscribe({
      next: (list) => {
        this.orders.set(this.sortByDateDesc(list));
        this.loading.set(false);
      },
      error: () => {
        // Fallback : si /me n'existe pas, on tente par storeId
        const storeId = Number(this.auth.getStoreId());
        if (!storeId) {
          this.errorMsg.set("Impossible de charger vos commandes.");
          this.loading.set(false);
          return;
        }
        this.orderService.getOrdersByStore(storeId).subscribe({
          next: (list) => {
            this.orders.set(this.sortByDateDesc(list));
            this.loading.set(false);
          },
          error: () => {
            this.errorMsg.set("Impossible de charger vos commandes.");
            this.loading.set(false);
          },
        });
      },
    });
  }

  private sortByDateDesc(list: OrderDetailsDto[]): OrderDetailsDto[] {
    return [...list].sort(
      (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    );
  }

  toggle(orderId: number): void {
    const set = new Set(this.expanded());
    if (set.has(orderId)) set.delete(orderId);
    else set.add(orderId);
    this.expanded.set(set);
  }

  isExpanded(orderId: number): boolean {
    return this.expanded().has(orderId);
  }
}
