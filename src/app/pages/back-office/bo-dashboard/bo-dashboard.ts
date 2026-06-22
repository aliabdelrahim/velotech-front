import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService, OrderDetailsDto } from '../../../services/order';
import { RentalService, RentalDetailsDto } from '../../../services/rental';
import { AppointmentService, AppointmentDetailsDto } from '../../../services/appointment';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-bo-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './bo-dashboard.html',
  styleUrl: './bo-dashboard.scss',
})
export class BoDashboardComponent implements OnInit {
  private orderService = inject(OrderService);
  private rentalService = inject(RentalService);
  private appointmentService = inject(AppointmentService);
  private auth = inject(AuthService);

  orders = signal<OrderDetailsDto[]>([]);
  rentals = signal<RentalDetailsDto[]>([]);
  appointments = signal<AppointmentDetailsDto[]>([]);
  loading = signal(true);

  // KPI
  totalRevenue = computed(() =>
    this.orders().reduce((sum, o) => sum + o.totalAmount, 0)
  );
  ordersCount = computed(() => this.orders().length);
  activeRentals = computed(
    () =>
      this.rentals().filter(
        (r) => r.status !== 'Cancelled' && new Date(r.endDate) >= new Date()
      ).length
  );
  upcomingAppts = computed(
    () =>
      this.appointments().filter(
        (a) => a.status !== 'Cancelled' && new Date(a.scheduledAt) >= new Date()
      ).length
  );

  recentOrders = computed(() => this.orders().slice(0, 5));
  upcomingApptsList = computed(() =>
    [...this.appointments()]
      .filter(
        (a) => a.status !== 'Cancelled' && new Date(a.scheduledAt) >= new Date()
      )
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      )
      .slice(0, 5)
  );

  ngOnInit(): void {
    const sid = Number(this.auth.getStoreId());

    // Charger les commandes du magasin (manager) ou /me sinon
    if (sid) {
      this.orderService.getOrdersByStore(sid).subscribe({
        next: (list) => this.orders.set(this.sortByDateDesc(list, 'orderDate')),
        error: () => {},
      });
    }

    this.appointmentService.getMyAppointments().subscribe({
      next: (list) => this.appointments.set(list),
      error: () => {},
    });

    this.rentalService.getMyRentals().subscribe({
      next: (list) => {
        this.rentals.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private sortByDateDesc<T>(list: T[], key: keyof T): T[] {
    return [...list].sort((a, b) => {
      const da = new Date(a[key] as unknown as string).getTime();
      const db = new Date(b[key] as unknown as string).getTime();
      return db - da;
    });
  }
}
