import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth';
import { environment } from '../../../../environments/environment';

interface RepairDto {
  repairId: number;
  appointmentId?: number | null;
  userName: string;
  technicianName: string;
  productName: string;
  diagnosis?: string | null;
  workDone?: string | null;
  cost?: number | null;
  status: string;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

@Component({
  selector: 'app-bo-repairs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bo-repairs.html',
  styleUrl: '../bo-orders/bo-orders.scss',
})
export class BoRepairsComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  repairs = signal<RepairDto[]>([]);
  loading = signal(true);
  errorMsg = signal<string | null>(null);
  searchTerm = signal('');
  statusFilter = signal<string>('all');
  apiUrl = `${environment.apiUrl}/repairs`;

  statuses = ['all', 'Pending', 'InProgress', 'Completed', 'Cancelled'];

  filtered = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();
    return this.repairs().filter((r) => {
      if (status !== 'all' && r.status !== status) return false;
      if (!q) return true;
      return (
        String(r.repairId).includes(q) ||
        (r.userName ?? '').toLowerCase().includes(q) ||
        (r.productName ?? '').toLowerCase().includes(q) ||
        (r.diagnosis ?? '').toLowerCase().includes(q)
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
      .get<RepairDto[]>(`${this.apiUrl}?storeId=${sid}`)
      .subscribe({
        next: (list) => {
          this.repairs.set(
            [...list].sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          );
          this.loading.set(false);
        },
        error: () => {
          this.errorMsg.set('Impossible de charger les reparations.');
          this.loading.set(false);
        },
      });
  }

  startRepair(r: RepairDto): void {
    this.http.post(`${this.apiUrl}/${r.repairId}/start`, {}).subscribe({
      next: () => this.refreshOne(r.repairId),
      error: () => alert('Erreur au demarrage.'),
    });
  }

  completeRepair(r: RepairDto): void {
    const cost = prompt('Cout final (EUR) :', String(r.cost ?? ''));
    if (cost === null) return;
    const c = Number(cost);
    if (isNaN(c) || c < 0) return alert('Cout invalide.');
    const work = prompt('Travail effectue :', r.workDone ?? '') ?? '';
    this.http
      .post(`${this.apiUrl}/${r.repairId}/complete`, { cost: c, workDone: work })
      .subscribe({
        next: () => this.refreshOne(r.repairId),
        error: () => alert('Erreur a la cloture.'),
      });
  }

  private refreshOne(id: number): void {
    this.http.get<RepairDto>(`${this.apiUrl}/${id}`).subscribe({
      next: (updated) => {
        this.repairs.update((list) =>
          list.map((x) => (x.repairId === id ? updated : x))
        );
      },
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'Completed': return 'badge-success';
      case 'InProgress': return 'badge-info';
      case 'Cancelled': return 'badge-warning';
      default: return 'badge-info';
    }
  }
}
