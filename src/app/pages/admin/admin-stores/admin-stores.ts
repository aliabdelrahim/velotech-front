import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { StoreService, StoreDetailsDto } from '../../../services/store';
import { environment } from '../../../../environments/environment';

interface CreateStoreForm {
  name: string;
  address: string;
}

@Component({
  selector: 'app-admin-stores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-stores.html',
  styleUrl: '../../back-office/bo-orders/bo-orders.scss',
})
export class AdminStoresComponent implements OnInit {
  private http = inject(HttpClient);
  private storeService = inject(StoreService);

  stores = signal<StoreDetailsDto[]>([]);
  loading = signal(true);
  errorMsg = signal<string | null>(null);
  searchTerm = signal('');
  creating = signal(false);
  form = signal<CreateStoreForm>({ name: '', address: '' });

  filtered = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    if (!q) return this.stores();
    return this.stores().filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.storeService.getAll().subscribe({
      next: (list) => {
        this.stores.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('Impossible de charger les magasins.');
        this.loading.set(false);
      },
    });
  }

  set<K extends keyof CreateStoreForm>(key: K, value: CreateStoreForm[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  createStore(): void {
    const f = this.form();
    if (!f.name.trim() || !f.address.trim()) return alert('Nom et adresse requis.');
    this.creating.set(true);
    this.http.post<StoreDetailsDto>(`${environment.apiUrl}/stores`, f).subscribe({
      next: (created) => {
        this.stores.update((list) => [...list, created]);
        this.form.set({ name: '', address: '' });
        this.creating.set(false);
      },
      error: () => {
        alert('Erreur a la creation.');
        this.creating.set(false);
      },
    });
  }
}
