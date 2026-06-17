import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { OrderService, CreateOrderDto } from '../../services/order';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

interface CheckoutModel {
  firstName: string;
  lastName: string;
  address: string;
  zip: string;
  city: string;
  shippingMode: 'standard' | 'pickup';
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  acceptedTerms: boolean;
}

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  address?: string;
  zip?: string;
  city?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  terms?: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class CheckoutComponent {
  cart = inject(CartService);
  private auth = inject(AuthService);
  private orderService = inject(OrderService);
  private router = inject(Router);

  model = signal<CheckoutModel>({
    firstName: '',
    lastName: '',
    address: '',
    zip: '',
    city: '',
    shippingMode: 'standard',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    acceptedTerms: false,
  });

  errors = signal<FieldErrors>({});
  showErrorBanner = signal(false);
  submitting = signal(false);
  serverError = signal<string | null>(null);

  errorCount = computed(() => Object.keys(this.errors()).length);

  finalShipping = computed(() =>
    this.model().shippingMode === 'pickup' ? 0 : this.cart.shipping()
  );

  finalTotal = computed(() =>
    +(this.cart.subtotal() + this.finalShipping()).toFixed(2)
  );

  set<K extends keyof CheckoutModel>(key: K, value: CheckoutModel[K]): void {
    this.model.update((m) => ({ ...m, [key]: value }));
  }

  private validate(): FieldErrors {
    const m = this.model();
    const e: FieldErrors = {};
    if (!m.firstName.trim()) e.firstName = 'Prénom requis';
    if (!m.lastName.trim()) e.lastName = 'Nom requis';
    if (!m.address.trim()) e.address = 'Veuillez renseigner votre adresse';
    if (!/^\d{4}$/.test(m.zip.trim()))
      e.zip = 'Code postal invalide (4 chiffres)';
    if (!m.city.trim()) e.city = 'Ville requise';
    const digits = m.cardNumber.replace(/\s+/g, '');
    if (!/^\d{16}$/.test(digits))
      e.cardNumber = 'Numéro incomplet (16 chiffres requis)';
    if (!/^\d{2}\/\d{2}$/.test(m.cardExpiry.trim()))
      e.cardExpiry = 'Format attendu : MM/AA';
    if (!/^\d{3,4}$/.test(m.cardCvv.trim()))
      e.cardCvv = 'CVV invalide';
    if (!m.acceptedTerms)
      e.terms = 'Vous devez accepter les conditions générales';
    return e;
  }

  onSubmit(form: NgForm): void {
    this.serverError.set(null);
    const e = this.validate();
    this.errors.set(e);

    if (Object.keys(e).length > 0) {
      this.showErrorBanner.set(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // OK -> envoi a l'API
    this.submitting.set(true);
    const userIdStr = this.auth.getUserId();
    const storeIdStr = this.auth.getStoreId();
    const userId = userIdStr ? Number(userIdStr) : 0;
    const storeId = storeIdStr ? Number(storeIdStr) : 1;

    const dto: CreateOrderDto = {
      storeId,
      userId,
      items: this.cart.items().map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    };

    this.orderService.createOrder(dto).subscribe({
      next: (order) => {
        this.cart.clear();
        const orderId = (order as { orderId?: number })?.orderId ?? 0;
        this.router.navigate(['/order-confirmation', orderId]);
      },
      error: (err) => {
        this.submitting.set(false);
        this.serverError.set(
          err?.error?.message || 'Une erreur est survenue. Réessayez.'
        );
      },
    });
  }
}
