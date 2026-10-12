import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RentalService, RentalDetailsDto } from '../../services/rental';
import { PaymentService } from '../../services/payment';
import { AuthService } from '../../services/auth';
import { LanguageService } from '../../services/language.service';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

interface PaymentModel {
  acceptedTerms: boolean;
}

interface FieldErrors {
  terms?: string;
}

@Component({
  selector: 'app-rental-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, HeaderComponent, FooterComponent],
  templateUrl: './rental-payment.html',
  styleUrl: './rental-payment.scss',
})
export class RentalPaymentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private rentalService = inject(RentalService);
  private paymentService = inject(PaymentService);
  private auth = inject(AuthService);
  private i18n = inject(TranslateService);
  private lang = inject(LanguageService);

  rental = signal<RentalDetailsDto | null>(null);
  loading = signal(true);
  loadError = signal<string | null>(null);

  model = signal<PaymentModel>({
    acceptedTerms: false,
  });

  errors = signal<FieldErrors>({});
  showErrorBanner = signal(false);
  submitting = signal(false);
  serverError = signal<string | null>(null);

  errorCount = computed(() => Object.keys(this.errors()).length);

  durationDays = computed(() => {
    const r = this.rental();
    if (!r) return 0;
    const s = new Date(r.startDate).getTime();
    const e = new Date(r.endDate).getTime();
    return Math.max(1, Math.round((e - s) / 86_400_000));
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.loadError.set(this.i18n.instant('RENTAL_PAY.NOT_FOUND'));
      this.loading.set(false);
      return;
    }
    this.rentalService.getById(id).subscribe({
      next: (r) => {
        this.rental.set(r);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(this.i18n.instant('RENTAL_PAY.LOAD_ERROR'));
        this.loading.set(false);
      },
    });
  }

  set<K extends keyof PaymentModel>(key: K, value: PaymentModel[K]): void {
    this.model.update((m) => ({ ...m, [key]: value }));
  }

  private validate(): FieldErrors {
    const m = this.model();
    const e: FieldErrors = {};
    if (!m.acceptedTerms)
      e.terms = this.i18n.instant('RENTAL_PAY.ERR_TERMS');
    return e;
  }

  onSubmit(_form: NgForm): void {
    this.serverError.set(null);
    const e = this.validate();
    this.errors.set(e);

    if (Object.keys(e).length > 0) {
      this.showErrorBanner.set(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const r = this.rental();
    if (!r) return;

    const userIdStr = this.auth.getUserId();
    if (!userIdStr) {
      this.router.navigate(['/login']);
      return;
    }

    // Redirection vers la page de paiement Stripe (cartes, Bancontact...).
    // Retour sur /payment/success ou /payment/cancel.
    this.submitting.set(true);
    this.paymentService
      .createCheckoutSession({ rentalId: r.rentalId }, this.lang.current())
      .subscribe({
        next: (session) => (window.location.href = session.url),
        error: (err) => {
          this.submitting.set(false);
          const msg = typeof err?.error === 'string' ? err.error : err?.error?.message;
          this.serverError.set(msg || this.i18n.instant('RENTAL_PAY.ERR_PAYMENT_FAILED'));
        },
      });
  }
}
