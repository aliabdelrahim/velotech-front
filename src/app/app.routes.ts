import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard';
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
  // IMPORTANT : /products/create et /products/edit/:id doivent etre declares
  // AVANT /products/:id, sinon ces chemins matchent la fiche produit publique
  // (avec id = "create" ou id = "edit").
  {
    path: 'products/create',
    loadComponent: () =>
      import('./pages/create-product/create-product').then(
        (m) => m.CreateProductComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'products/edit/:id',
    loadComponent: () =>
      import('./pages/edit-product/edit-product').then(
        (m) => m.EditProductComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./pages/product-detail/product-detail').then(
        (m) => m.ProductDetailComponent
      ),
  },
  {
    path: 'stores',
    loadComponent: () =>
      import('./pages/stores/stores').then((m) => m.StoresComponent),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./pages/about/about').then((m) => m.AboutComponent),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/contact/contact').then((m) => m.ContactComponent),
  },
  {
    path: 'legal',
    loadComponent: () =>
      import('./pages/legal/legal').then((m) => m.LegalComponent),
  },
  {
    path: 'legal/:section',
    loadComponent: () =>
      import('./pages/legal/legal').then((m) => m.LegalComponent),
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
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register').then((m) => m.RegisterComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password').then(
        (m) => m.ForgotPasswordComponent
      ),
    canActivate: [guestGuard],
  },
  {
    path: 'reset-password/:token',
    loadComponent: () =>
      import('./pages/reset-password/reset-password').then(
        (m) => m.ResetPasswordComponent
      ),
    canActivate: [guestGuard],
  },

  // -------- Espace client --------
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile/profile').then((m) => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'my-orders',
    loadComponent: () =>
      import('./pages/my-orders/my-orders').then((m) => m.MyOrdersComponent),
    canActivate: [authGuard],
  },
  {
    path: 'my-rentals',
    loadComponent: () =>
      import('./pages/my-rentals/my-rentals').then((m) => m.MyRentalsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'my-appointments',
    loadComponent: () =>
      import('./pages/my-appointments/my-appointments').then(
        (m) => m.MyAppointmentsComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'rentals/new',
    loadComponent: () =>
      import('./pages/rental-new/rental-new').then((m) => m.RentalNewComponent),
    canActivate: [authGuard],
  },
  {
    path: 'rentals/:id/payment',
    loadComponent: () =>
      import('./pages/rental-payment/rental-payment').then(
        (m) => m.RentalPaymentComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'appointments/new',
    loadComponent: () =>
      import('./pages/appointment-new/appointment-new').then(
        (m) => m.AppointmentNewComponent
      ),
    canActivate: [authGuard],
  },

  // -------- Back-office (Manager / Tech / Admin) --------
  {
    path: 'back-office',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/bo-layout/bo-layout').then((m) => m.BoLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/back-office/bo-dashboard/bo-dashboard').then(
            (m) => m.BoDashboardComponent
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/back-office/bo-orders/bo-orders').then(
            (m) => m.BoOrdersComponent
          ),
      },
      {
        path: 'rentals',
        loadComponent: () =>
          import('./pages/back-office/bo-rentals/bo-rentals').then(
            (m) => m.BoRentalsComponent
          ),
      },
      {
        path: 'appointments',
        loadComponent: () =>
          import('./pages/back-office/bo-appointments/bo-appointments').then(
            (m) => m.BoAppointmentsComponent
          ),
      },
      {
        path: 'repairs',
        loadComponent: () =>
          import('./pages/back-office/bo-repairs/bo-repairs').then(
            (m) => m.BoRepairsComponent
          ),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./pages/back-office/bo-payments/bo-payments').then(
            (m) => m.BoPaymentsComponent
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/back-office/bo-products/bo-products').then(
            (m) => m.BoProductsComponent
          ),
      },
      {
        path: 'stocks',
        loadComponent: () =>
          import('./pages/back-office/bo-stocks/bo-stocks').then(
            (m) => m.BoStocksComponent
          ),
      },
    ],
  },

  // -------- Admin (Admin uniquement) --------
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/bo-layout/bo-layout').then((m) => m.BoLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'stores',
        pathMatch: 'full',
      },
      {
        path: 'stores',
        loadComponent: () =>
          import('./pages/admin/admin-stores/admin-stores').then(
            (m) => m.AdminStoresComponent
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/admin/admin-users/admin-users').then(
            (m) => m.AdminUsersComponent
          ),
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./pages/admin/admin-roles/admin-roles').then(
            (m) => m.AdminRolesComponent
          ),
      },
    ],
  },

  // -------- Fallback --------
  { path: '**', redirectTo: '' },
];
