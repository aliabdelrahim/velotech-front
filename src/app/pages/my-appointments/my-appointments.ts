import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppointmentService, AppointmentDetailsDto } from '../../services/appointment';
import { RepairService, RepairDetailsDto } from '../../services/repair';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

type Tab = 'all' | 'upcoming' | 'past' | 'cancelled';

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, HeaderComponent, FooterComponent],
  templateUrl: './my-appointments.html',
  styleUrl: './my-appointments.scss',
})
export class MyAppointmentsComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private repairService = inject(RepairService);
  private i18n = inject(TranslateService);

  appointments = signal<AppointmentDetailsDto[]>([]);
  loading = signal(true);
  errorMsg = signal<string | null>(null);
  activeTab = signal<Tab>('upcoming');
  cancellingId = signal<number | null>(null);

  /**
   * Cache des reparations liees aux RDV, indexe par appointmentId.
   * Charge a la demande quand le client clique "Voir les details".
   * null = pas encore charge, undefined dans Map = en cours, Object = charge.
   */
  repairsByAppointment = signal<Map<number, RepairDetailsDto | 'loading' | 'error' | 'none'>>(new Map());
  expandedAppointmentId = signal<number | null>(null);

  now = new Date();

  /**
   * Un RDV est "a venir" si :
   *  - il n'est pas annule
   *  - il n'est pas termine (Completed = reparation finie, meme avec date future)
   *  - sa date est dans le futur
   * Un RDV est "passe" si :
   *  - il est termine (Completed), OU
   *  - sa date est deja passee (et pas annule)
   */
  private isUpcoming(a: AppointmentDetailsDto): boolean {
    return (
      a.status !== 'Cancelled' &&
      a.status !== 'Completed' &&
      new Date(a.scheduledAt) >= this.now
    );
  }

  private isPast(a: AppointmentDetailsDto): boolean {
    if (a.status === 'Cancelled') return false;
    if (a.status === 'Completed') return true;
    return new Date(a.scheduledAt) < this.now;
  }

  filtered = computed(() => {
    const tab = this.activeTab();
    const items = this.appointments();
    if (tab === 'all') return items;
    if (tab === 'cancelled') return items.filter((a) => a.status === 'Cancelled');
    if (tab === 'upcoming') return items.filter((a) => this.isUpcoming(a));
    return items.filter((a) => this.isPast(a));
  });

  totals = computed(() => {
    const items = this.appointments();
    return {
      all: items.length,
      upcoming: items.filter((a) => this.isUpcoming(a)).length,
      past: items.filter((a) => this.isPast(a)).length,
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
        this.errorMsg.set(this.i18n.instant('APPT.LOAD_ERROR'));
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
    const date = new Date(a.scheduledAt).toLocaleDateString();
    if (!confirm(this.i18n.instant('APPT.CANCEL_CONFIRM', { date })))
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
        alert(this.i18n.instant('APPT.CANCEL_ERROR'));
        this.cancellingId.set(null);
      },
    });
  }

  /**
   * Expand/collapse les details de la reparation liee a un RDV termine.
   * Charge la reparation en lazy (seule la premiere fois).
   */
  toggleRepairDetails(a: AppointmentDetailsDto): void {
    const currentId = this.expandedAppointmentId();
    if (currentId === a.appointmentId) {
      this.expandedAppointmentId.set(null);
      return;
    }
    this.expandedAppointmentId.set(a.appointmentId);

    const map = this.repairsByAppointment();
    if (map.has(a.appointmentId)) return; // deja charge

    const newMap = new Map(map);
    newMap.set(a.appointmentId, 'loading');
    this.repairsByAppointment.set(newMap);

    this.repairService.getByAppointment(a.appointmentId).subscribe({
      next: (repair) => {
        const m2 = new Map(this.repairsByAppointment());
        m2.set(a.appointmentId, repair);
        this.repairsByAppointment.set(m2);
      },
      error: (err) => {
        const m2 = new Map(this.repairsByAppointment());
        m2.set(a.appointmentId, err?.status === 404 ? 'none' : 'error');
        this.repairsByAppointment.set(m2);
      },
    });
  }

  isExpanded(a: AppointmentDetailsDto): boolean {
    return this.expandedAppointmentId() === a.appointmentId;
  }

  getRepairState(a: AppointmentDetailsDto): RepairDetailsDto | 'loading' | 'error' | 'none' | null {
    return this.repairsByAppointment().get(a.appointmentId) ?? null;
  }

  isRepairLoaded(a: AppointmentDetailsDto): boolean {
    const s = this.getRepairState(a);
    return s !== null && s !== 'loading' && s !== 'error' && s !== 'none';
  }

  getRepair(a: AppointmentDetailsDto): RepairDetailsDto | null {
    const s = this.getRepairState(a);
    return this.isRepairLoaded(a) ? (s as RepairDetailsDto) : null;
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
