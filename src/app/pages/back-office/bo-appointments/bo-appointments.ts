import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AppointmentDetailsDto } from '../../../services/appointment';
import { AuthService } from '../../../services/auth';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-bo-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bo-appointments.html',
  styleUrl: '../bo-orders/bo-orders.scss',
})
export class BoAppointmentsComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  appointments = signal<AppointmentDetailsDto[]>([]);
  loading = signal(true);
  errorMsg = signal<string | null>(null);
  searchTerm = signal('');
  statusFilter = signal<string>('all');

  statuses = ['all', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

  filtered = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();
    return this.appointments().filter((a) => {
      if (status !== 'all' && a.status !== status) return false;
      if (!q) return true;
      return (
        String(a.appointmentId).includes(q) ||
        (a.userName ?? '').toLowerCase().includes(q) ||
        (a.serviceType ?? '').toLowerCase().includes(q)
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
      .get<AppointmentDetailsDto[]>(
        `${environment.apiUrl}/appointments?storeId=${sid}`
      )
      .subscribe({
        next: (list) => {
          this.appointments.set(
            [...list].sort(
              (a, b) =>
                new Date(b.scheduledAt).getTime() -
                new Date(a.scheduledAt).getTime()
            )
          );
          this.loading.set(false);
        },
        error: () => {
          this.errorMsg.set('Impossible de charger les rendez-vous.');
          this.loading.set(false);
        },
      });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'Confirmed': return 'badge-success';
      case 'Completed': return 'badge-info';
      case 'Cancelled': return 'badge-warning';
      default: return 'badge-info';
    }
  }
}
