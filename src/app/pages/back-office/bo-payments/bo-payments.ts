import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService, PaymentDetailsDto, PaymentType } from '../../../services/payment';

type TypeFilter = 'all' | PaymentType;

@Component({
  selector: 'app-bo-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bo-payments.html',
  styleUrl: './bo-payments.scss',
})
export class BoPaymentsComponent implements OnInit {
  private paymentService = inject(PaymentService);

  payments = signal<PaymentDetailsDto[]>([]);
  loading = signal(true);
  errorMsg = signal<string | null>(null);
  searchTerm = signal('');
  typeFilter = signal<TypeFilter>('all');

  filtered = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    const t = this.typeFilter();
    return this.payments().filter((p) => {
      if (t !== 'all' && p.paymentType !== t) return false;
      if (!q) return true;
      return (
        String(p.paymentId).includes(q) ||
        (p.userName ?? '').toLowerCase().includes(q) ||
        String(p.orderId ?? '').includes(q) ||
        String(p.rentalId ?? '').includes(q) ||
        String(p.repairId ?? '').includes(q)
      );
    });
  });

  totalPaid = computed(() =>
    this.filtered()
      .filter((p) => p.status === 'Paid')
      .reduce((sum, p) => sum + Number(p.amount), 0)
  );

  countByType = computed(() => {
    const list = this.payments();
    return {
      all: list.length,
      Order: list.filter((p) => p.paymentType === 'Order').length,
      Rental: list.filter((p) => p.paymentType === 'Rental').length,
      Repair: list.filter((p) => p.paymentType === 'Repair').length,
    };
  });

  ngOnInit(): void {
    this.loadPayments();
  }

  private loadPayments(): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.paymentService.list().subscribe({
      next: (list) => {
        // Tri decroissant : les paiements les plus recents en premier
        this.payments.set(
          [...list].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('Impossible de charger les paiements.');
        this.loading.set(false);
      },
    });
  }

  setType(t: TypeFilter): void {
    this.typeFilter.set(t);
  }

  targetLabel(p: PaymentDetailsDto): string {
    if (p.orderId) return `CMD-${p.orderId}`;
    if (p.rentalId) return `LOC-${p.rentalId}`;
    if (p.repairId) return `REP-${p.repairId}`;
    return '—';
  }

  typeLabel(t: PaymentType): string {
    switch (t) {
      case 'Order': return 'Commande';
      case 'Rental': return 'Location';
      case 'Repair': return 'Reparation';
      default: return t;
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'Paid': return 'badge-success';
      case 'Pending': return 'badge-info';
      case 'Failed': return 'badge-danger';
      case 'Refunded': return 'badge-warning';
      default: return 'badge-info';
    }
  }
}
