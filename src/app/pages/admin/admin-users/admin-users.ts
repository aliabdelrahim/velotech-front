import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UserDetailsDto } from '../../../services/user';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.html',
  styleUrl: '../../back-office/bo-orders/bo-orders.scss',
})
export class AdminUsersComponent implements OnInit {
  private http = inject(HttpClient);

  users = signal<UserDetailsDto[]>([]);
  loading = signal(true);
  errorMsg = signal<string | null>(null);
  searchTerm = signal('');
  roleFilter = signal<string>('all');

  roles = computed(() => {
    const set = new Set<string>(this.users().map((u) => u.roleName).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  });

  filtered = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    const role = this.roleFilter();
    return this.users().filter((u) => {
      if (role !== 'all' && u.roleName !== role) return false;
      if (!q) return true;
      return (
        String(u.id).includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.storeName ?? '').toLowerCase().includes(q)
      );
    });
  });

  ngOnInit(): void {
    this.http.get<UserDetailsDto[]>(`${environment.apiUrl}/users`).subscribe({
      next: (list) => {
        this.users.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('Impossible de charger les utilisateurs.');
        this.loading.set(false);
      },
    });
  }

  roleBadgeClass(role: string): string {
    switch (role) {
      case 'Admin': return 'badge-warning';
      case 'Manager': return 'badge-success';
      case 'Tech': return 'badge-info';
      case 'Client': return 'badge-info';
      default: return 'badge-info';
    }
  }
}
