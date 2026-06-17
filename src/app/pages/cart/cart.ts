import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService, CartItem } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class CartComponent {
  private router = inject(Router);
  cart = inject(CartService);
  auth = inject(AuthService);

  inc(item: CartItem): void {
    this.cart.updateQty(item.productId, item.quantity + 1, item.size);
  }

  dec(item: CartItem): void {
    this.cart.updateQty(item.productId, item.quantity - 1, item.size);
  }

  remove(item: CartItem): void {
    this.cart.remove(item.productId, item.size);
  }

  proceedToCheckout(): void {
    if (!this.auth.isLoggedIn()) {
      // Redirige vers login en gardant l'intention d'aller au checkout
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }
    this.router.navigate(['/checkout']);
  }
}
