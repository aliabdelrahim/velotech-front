import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProductService, ProductDetailsDto } from '../../services/product';
import { StoreService, StoreDetailsDto } from '../../services/store';
import { RentalService, CreateRentalDto } from '../../services/rental';
import { AuthService } from '../../services/auth';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

interface RentalForm {
  storeId: number | null;
  productId: number | null;
  startDate: string;
  endDate: string;
}

interface FieldErrors {
  storeId?: string;
  productId?: string;
  startDate?: string;
  endDate?: string;
}

@Component({
  selector: 'app-rental-new',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, HeaderComponent, FooterComponent],
  templateUrl: './rental-new.html',
  styleUrl: './rental-new.scss',
})
export class RentalNewComponent implements OnInit {
  private productService = inject(ProductService);
  private storeService = inject(StoreService);
  private rentalService = inject(RentalService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private i18n = inject(TranslateService);

  stores = signal<StoreDetailsDto[]>([]);
  rentableProducts = signal<ProductDetailsDto[]>([]);
  loading = signal(true);

  model = signal<RentalForm>({
    storeId: null,
    productId: null,
    startDate: this.todayPlus(1),
    endDate: this.todayPlus(3),
  });

  errors = signal<FieldErrors>({});
  serverError = signal<string | null>(null);
  submitting = signal(false);

  selectedProduct = computed(() => {
    const id = this.model().productId;
    return id ? this.rentableProducts().find((p) => p.id === id) ?? null : null;
  });

  durationDays = computed(() => {
    const m = this.model();
    if (!m.startDate || !m.endDate) return 0;
    const s = new Date(m.startDate).getTime();
    const e = new Date(m.endDate).getTime();
    return Math.max(0, Math.round((e - s) / 86_400_000));
  });

  estimatedPrice = computed(() => {
    const p = this.selectedProduct();
    const days = this.durationDays();
    if (!p || !p.priceRental || days === 0) return 0;
    return +(Number(p.priceRental) * days).toFixed(2);
  });

  ngOnInit(): void {
    this.storeService.getAll().subscribe({
      next: (s) => this.stores.set(s),
      error: () => {},
    });

    this.productService.getProducts().subscribe({
      next: (list) => {
        this.rentableProducts.set(list.filter((p) => p.isRentable));
        this.loading.set(false);

        // Pre-selection du produit si on arrive depuis la fiche produit
        // (lien "Louer ce velo" -> /rentals/new?productId=XX)
        const presetProductId = Number(this.route.snapshot.queryParamMap.get('productId'));
        if (presetProductId && list.some((p) => p.id === presetProductId && p.isRentable)) {
          this.set('productId', presetProductId);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  set<K extends keyof RentalForm>(key: K, value: RentalForm[K]): void {
    this.model.update((m) => ({ ...m, [key]: value }));
  }

  private todayPlus(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  private validate(): FieldErrors {
    const m = this.model();
    const e: FieldErrors = {};
    if (!m.storeId) e.storeId = this.i18n.instant('RENTAL_NEW.ERR_STORE');
    if (!m.productId) e.productId = this.i18n.instant('RENTAL_NEW.ERR_PRODUCT');
    if (!m.startDate) e.startDate = this.i18n.instant('RENTAL_NEW.ERR_START');
    if (!m.endDate) e.endDate = this.i18n.instant('RENTAL_NEW.ERR_END');
    if (m.startDate && m.endDate && new Date(m.endDate) <= new Date(m.startDate)) {
      e.endDate = this.i18n.instant('RENTAL_NEW.ERR_END_AFTER');
    }
    if (m.startDate && new Date(m.startDate) < new Date(this.todayPlus(0))) {
      e.startDate = this.i18n.instant('RENTAL_NEW.ERR_START_PAST');
    }
    return e;
  }

  onSubmit(form: NgForm): void {
    this.serverError.set(null);
    const e = this.validate();
    this.errors.set(e);
    if (Object.keys(e).length > 0) return;

    const m = this.model();
    const userIdStr = this.auth.getUserId();
    if (!userIdStr) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/rentals/new' } });
      return;
    }

    const dto: CreateRentalDto = {
      userId: Number(userIdStr),
      storeId: m.storeId!,
      productId: m.productId!,
      startDate: new Date(m.startDate).toISOString(),
      endDate: new Date(m.endDate).toISOString(),
    };

    this.submitting.set(true);

    this.rentalService.create(dto).subscribe({
      next: (rental) => {
        this.submitting.set(false);
        // La location est cree cote back. Le client passe maintenant
        // par l'etape de paiement (carte bancaire) avant de voir la
        // confirmation finale dans son espace.
        this.router.navigate(['/rentals', rental.rentalId, 'payment']);
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = typeof err?.error === 'string' ? err.error : err?.error?.message;
        this.serverError.set(msg || this.i18n.instant('RENTAL_NEW.ERR_CREATE'));
      },
    });
  }
}
