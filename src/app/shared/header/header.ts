import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private cart = inject(CartService);

  cartCount = computed(() => this.cart.count());

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  get role(): string | null {
    return this.auth.getRole();
  }

  get dashboardLink(): string {
    const r = this.role;
    if (r === 'Admin' || r === 'Manager' || r === 'Tech') return '/back-office';
    return '/dashboard';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
