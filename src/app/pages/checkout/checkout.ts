import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { OrderService, CreateOrderDto } from '../../services/order';
import { PaymentService } from '../../services/payment';
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
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, HeaderComponent, FooterComponent],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class CheckoutComponent {
  cart = inject(CartService);
  private auth = inject(AuthService);
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);
  private router = inject(Router);
  private i18n = inject(TranslateService);

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
    if (!m.firstName.trim()) e.firstName = this.i18n.instant('CHECKOUT.ERR_FIRST_NAME');
    if (!m.lastName.trim()) e.lastName = this.i18n.instant('CHECKOUT.ERR_LAST_NAME');
    if (!m.address.trim()) e.address = this.i18n.instant('CHECKOUT.ERR_ADDRESS');
    if (!/^\d{4}$/.test(m.zip.trim()))
      e.zip = this.i18n.instant('CHECKOUT.ERR_ZIP');
    if (!m.city.trim()) e.city = this.i18n.instant('CHECKOUT.ERR_CITY');
    const digits = m.cardNumber.replace(/\s+/g, '');
    if (!/^\d{16}$/.test(digits))
      e.cardNumber = this.i18n.instant('CHECKOUT.ERR_CARD_NUMBER');
    if (!/^\d{2}\/\d{2}$/.test(m.cardExpiry.trim()))
      e.cardExpiry = this.i18n.instant('CHECKOUT.ERR_CARD_EXPIRY');
    if (!/^\d{3,4}$/.test(m.cardCvv.trim()))
      e.cardCvv = this.i18n.instant('CHECKOUT.ERR_CARD_CVV');
    if (!m.acceptedTerms)
      e.terms = this.i18n.instant('CHECKOUT.ERR_TERMS');
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

    const amount = this.finalTotal();

    this.orderService.createOrder(dto).subscribe({
      next: (order) => {
        const orderId = (order as { orderId?: number })?.orderId ?? 0;

        // Enregistre le paiement simule dans la table Payments.
        // Le back marque immediatement le paiement comme "Paid".
        // Si le paiement echoue, la commande reste creee mais non payee :
        // l'operateur pourra la relancer depuis le back-office.
        this.paymentService
          .create({ userId, orderId, amount })
          .subscribe({
            next: () => {
              this.cart.clear();
              this.router.navigate(['/order-confirmation', orderId]);
            },
            error: () => {
              // On redirige quand meme vers la confirmation :
              // la commande est bien creee, seul le paiement est en erreur.
              this.cart.clear();
              this.router.navigate(['/order-confirmation', orderId]);
            },
          });
      },
      error: (err) => {
        this.submitting.set(false);
        this.serverError.set(
          err?.error?.message || this.i18n.instant('CHECKOUT.ERR_GENERIC')
        );
      },
    });
  }
}
