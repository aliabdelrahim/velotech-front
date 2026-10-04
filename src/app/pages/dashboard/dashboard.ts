import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth';
import { OrderService, OrderDetailsDto } from '../../services/order';
import { CartService } from '../../services/cart';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, HeaderComponent, FooterComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private cart = inject(CartService);
  private router = inject(Router);

  role = this.authService.getRole();
  userId = this.authService.getUserId();
  storeId = this.authService.getStoreId();

  orders = signal<OrderDetailsDto[]>([]);
  loadingOrders = signal(true);

  // Derived metrics
  totalOrders = computed(() => this.orders().length);
  totalSpent = computed(() =>
    this.orders().reduce((s, o) => s + o.totalAmount, 0)
  );
  lastOrder = computed(() => this.orders()[0] ?? null);

  cartItemsCount = computed(() => this.cart.count());

  get isClient(): boolean {
    return this.role === 'Client';
  }

  get hasBackOfficeAccess(): boolean {
    return ['Admin', 'Manager', 'Tech'].includes(this.role ?? '');
  }

  get isAdmin(): boolean {
    return this.role === 'Admin';
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.orderService.getMyOrders().subscribe({
      next: (list) => {
        this.orders.set(this.sortByDateDesc(list));
        this.loadingOrders.set(false);
      },
      error: () => {
        // Fallback : essayer par store si user a un store
        const sid = Number(this.storeId);
        if (sid) {
          this.orderService.getOrdersByStore(sid).subscribe({
            next: (list) => {
              this.orders.set(this.sortByDateDesc(list));
              this.loadingOrders.set(false);
            },
            error: () => this.loadingOrders.set(false),
          });
        } else {
          this.loadingOrders.set(false);
        }
      },
    });
  }

  private sortByDateDesc(list: OrderDetailsDto[]): OrderDetailsDto[] {
    return [...list].sort(
      (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    );
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/');
  }
}
