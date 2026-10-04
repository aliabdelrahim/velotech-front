import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule, LanguageSwitcherComponent],
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
    // "Mon espace" renvoie toujours vers le dashboard client,
    // meme pour le staff. L'acces au back-office se fait via
    // le bouton dedie (visible uniquement pour Admin/Manager/Tech).
    return '/dashboard';
  }

  get hasBackOfficeAccess(): boolean {
    const r = this.role;
    return r === 'Admin' || r === 'Manager' || r === 'Tech';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
