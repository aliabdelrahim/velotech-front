import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-bo-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './bo-layout.html',
  styleUrl: './bo-layout.scss',
})
export class BoLayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  role = this.auth.getRole();
  userId = this.auth.getUserId();
  storeId = this.auth.getStoreId();

  // L'utilisateur affiche son nom via le token (claim name dans JWT)
  userName = computed(() => {
    const token = this.auth.getToken();
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload['unique_name'] || payload['name'] || payload['Name'] || 'Utilisateur';
    } catch {
      return '';
    }
  });

  get isAdmin(): boolean {
    return this.role === 'Admin';
  }

  get isManager(): boolean {
    return this.role === 'Manager' || this.role === 'Admin';
  }

  get isTech(): boolean {
    return this.role === 'Tech' || this.role === 'Manager' || this.role === 'Admin';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
