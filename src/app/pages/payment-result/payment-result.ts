import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription, timer } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { CheckoutStatusDto, PaymentService } from '../../services/payment';
import { CartService } from '../../services/cart';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

type ViewState = 'checking' | 'paid' | 'pending' | 'cancelled' | 'error';

/**
 * Page de retour apres Stripe Checkout.
 *  - /payment/success?session_id=cs_... : on interroge l'API jusqu'a ce que le
 *    paiement soit confirme (webhook Stripe), puis on redirige.
 *  - /payment/cancel?payment_id=42 : le client a abandonne ; l'API expire la
 *    session et libere le stock reserve. Le panier est conserve.
 */
@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, HeaderComponent, FooterComponent],
  templateUrl: './payment-result.html',
  styleUrl: './payment-result.scss',
})
export class PaymentResultComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private payments = inject(PaymentService);
  private cart = inject(CartService);
  private destroyRef = inject(DestroyRef);

  state = signal<ViewState>('checking');
  payment = signal<CheckoutStatusDto | null>(null);

  ngOnInit(): void {
    const mode = this.route.snapshot.data['mode'] as 'success' | 'cancel';
    const query = this.route.snapshot.queryParamMap;

    if (mode === 'cancel') {
      const paymentId = Number(query.get('payment_id'));
      if (!paymentId) {
        this.state.set('cancelled');
        return;
      }
      this.payments.cancelCheckout(paymentId).subscribe({
        next: (p) => this.apply(p),
        error: () => this.state.set('cancelled'),
      });
      return;
    }

    const sessionId = query.get('session_id');
    if (!sessionId) {
      this.state.set('error');
      return;
    }

    // Le webhook peut arriver quelques secondes apres la redirection :
    // on interroge l'API toutes les 2 s pendant ~30 s.
    let attempts = 0;
    const sub: Subscription = timer(0, 2000)
      .pipe(
        switchMap(() => this.payments.getCheckoutStatus(sessionId)),
        takeWhile((p) => p.status === 'Pending' && ++attempts < 15, true)
      )
      .subscribe({
        next: (p) => this.apply(p),
        error: () => this.state.set('error'),
      });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  private apply(p: CheckoutStatusDto): void {
    this.payment.set(p);

    if (p.status === 'Paid') {
      if (p.paymentType === 'Order' && p.orderId) {
        this.cart.clear();
        this.router.navigate(['/order-confirmation', p.orderId]);
        return;
      }
      this.state.set('paid');
    } else if (p.status === 'Pending') {
      this.state.set('pending');
    } else {
      this.state.set('cancelled');
    }
  }

  /** Lien "Reessayer" adapte a la cible du paiement. */
  retryLink(): string[] {
    const p = this.payment();
    if (p?.rentalId) return ['/rentals', String(p.rentalId), 'payment'];
    if (p?.paymentType === 'Order') return ['/cart'];
    return ['/dashboard'];
  }

  doneLink(): string {
    const p = this.payment();
    if (p?.paymentType === 'Rental') return '/my-rentals';
    if (p?.paymentType === 'Order') return '/my-orders';
    return '/dashboard';
  }
}
