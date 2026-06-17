import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './guards/auth-guard';
import { guestGuard } from './guards/guest-guard';

export const routes: Routes = [
  // -------- Zone publique --------
  { path: '', component: HomeComponent },
  {
    path: 'catalog/:storeId',
    loadComponent: () =>
      import('./pages/catalog/catalog').then((m) => m.CatalogComponent),
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./pages/product-detail/product-detail').then(
        (m) => m.ProductDetailComponent
      ),
  },

  // -------- Parcours achat --------
  {
    path: 'cart',
    loadComponent: () =>
      import('./pages/cart/cart').then((m) => m.CartComponent),
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./pages/checkout/checkout').then((m) => m.CheckoutComponent),
    canActivate: [authGuard],
  },
  {
    path: 'order-confirmation/:id',
    loadComponent: () =>
      import('./pages/order-confirmation/order-confirmation').then(
        (m) => m.OrderConfirmationComponent
      ),
    canActivate: [authGuard],
  },

  // -------- Authentification --------
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },

  // -------- Fallback --------
  { path: '**', redirectTo: '' },
];
