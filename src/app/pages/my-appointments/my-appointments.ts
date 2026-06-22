import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppointmentService, AppointmentDetailsDto } from '../../services/appointment';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

type Tab = 'all' | 'upcoming' | 'past' | 'cancelled';

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './my-appointments.html',
  styleUrl: './my-appointments.scss',
})
export class MyAppointmentsComponent implements OnInit {
  private appointmentService = inject(AppointmentService);

  appointments = signal<AppointmentDetailsDto[]>([]);
  loading = signal(true);
  errorMsg = signal<string | null>(null);
  activeTab = signal<Tab>('upcoming');
  cancellingId = signal<number | null>(null);

  now = new Date();

  filtered = computed(() => {
    const tab = this.activeTab();
    const items = this.appointments();
    if (tab === 'all') return items;
    if (tab === 'cancelled') return items.filter((a) => a.status === 'Cancelled');
    if (tab === 'upcoming') {
      return items.filter((a) =>
        a.status !== 'Cancelled' && new Date(a.scheduledAt) >= this.now
      );
    }
    return items.filter((a) =>
      a.status !== 'Cancelled' && new Date(a.scheduledAt) < this.now
    );
  });

  totals = computed(() => {
    const items = this.appointments();
    return {
      all: items.length,
      upcoming: items.filter(
        (a) => a.status !== 'Cancelled' && new Date(a.scheduledAt) >= this.now
      ).length,
      past: items.filter(
        (a) => a.status !== 'Cancelled' && new Date(a.scheduledAt) < this.now
      ).length,
      cancelled: items.filter((a) => a.status === 'Cancelled').length,
    };
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.appointmentService.getMyAppointments().subscribe({
      next: (list) => {
        this.appointments.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('Impossible de charger vos rendez-vous.');
        this.loading.set(false);
      },
    });
  }

  setTab(t: Tab): void {
    this.activeTab.set(t);
  }

  canCancel(a: AppointmentDetailsDto): boolean {
    if (a.status === 'Cancelled' || a.status === 'Completed') return false;
    return new Date(a.scheduledAt) > this.now;
  }

  cancel(a: AppointmentDetailsDto): void {
    if (!confirm(`Annuler le rendez-vous du ${new Date(a.scheduledAt).toLocaleDateString()} ?`))
      return;
    this.cancellingId.set(a.appointmentId);
    this.appointmentService.cancel(a.appointmentId).subscribe({
      next: () => {
        this.appointments.update((list) =>
          list.map((x) =>
            x.appointmentId === a.appointmentId ? { ...x, status: 'Cancelled' } : x
          )
        );
        this.cancellingId.set(null);
      },
      error: () => {
        alert('Erreur lors de l\'annulation.');
        this.cancellingId.set(null);
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
