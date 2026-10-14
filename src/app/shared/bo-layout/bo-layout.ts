import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
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

  /** Menu lateral ouvert (ecrans etroits uniquement : en large il est toujours visible). */
  menuOpen = signal(false);

  constructor() {
    // Referme le menu des qu'on change de page
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => this.menuOpen.set(false));
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }

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
    // Accepte "Tech" (nom seede d'origine) et "Technicien" (variante FR)
    return (
      this.role === 'Tech' ||
      this.role === 'Technicien' ||
      this.role === 'Manager' ||
      this.role === 'Admin'
    );
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
