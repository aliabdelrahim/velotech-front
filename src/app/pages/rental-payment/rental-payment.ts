import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RentalService, RentalDetailsDto } from '../../services/rental';
import { PaymentService } from '../../services/payment';
import { AuthService } from '../../services/auth';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

interface PaymentModel {
  cardHolder: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  acceptedTerms: boolean;
}

interface FieldErrors {
  cardHolder?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
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

  rental = signal<RentalDetailsDto | null>(null);
  loading = signal(true);
  loadError = signal<string | null>(null);

  model = signal<PaymentModel>({
    cardHolder: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    acceptedTerms: false,
  });

  errors = signal<FieldErrors>({});
  showErrorBanner = signal(false);
  submitting = signal(false);
  serverError = signal<string | null>(null);
  paymentSuccess = signal(false);

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
    if (!m.cardHolder.trim()) e.cardHolder = this.i18n.instant('RENTAL_PAY.ERR_CARD_HOLDER');
    const digits = m.cardNumber.replace(/\s+/g, '');
    if (!/^\d{16}$/.test(digits))
      e.cardNumber = this.i18n.instant('RENTAL_PAY.ERR_CARD_NUMBER');
    if (!/^\d{2}\/\d{2}$/.test(m.cardExpiry.trim()))
      e.cardExpiry = this.i18n.instant('RENTAL_PAY.ERR_CARD_EXPIRY');
    if (!/^\d{3,4}$/.test(m.cardCvv.trim()))
      e.cardCvv = this.i18n.instant('RENTAL_PAY.ERR_CARD_CVV');
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

    this.submitting.set(true);
    this.paymentService
      .create({
        userId: Number(userIdStr),
        rentalId: r.rentalId,
        amount: Number(r.totalPrice),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.paymentSuccess.set(true);
          // Petite pause visuelle avant de rediriger
          setTimeout(() => this.router.navigate(['/my-rentals']), 1800);
        },
        error: (err) => {
          this.submitting.set(false);
          const msg = typeof err?.error === 'string' ? err.error : err?.error?.message;
          this.serverError.set(msg || this.i18n.instant('RENTAL_PAY.ERR_PAYMENT_FAILED'));
        },
      });
  }
}
