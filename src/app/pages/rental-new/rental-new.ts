import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './rental-new.html',
  styleUrl: './rental-new.scss',
})
export class RentalNewComponent implements OnInit {
  private productService = inject(ProductService);
  private storeService = inject(StoreService);
  private rentalService = inject(RentalService);
  private auth = inject(AuthService);
  private router = inject(Router);

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
    if (!m.storeId) e.storeId = 'Choisissez un magasin';
    if (!m.productId) e.productId = 'Choisissez un velo';
    if (!m.startDate) e.startDate = 'Date de debut requise';
    if (!m.endDate) e.endDate = 'Date de fin requise';
    if (m.startDate && m.endDate && new Date(m.endDate) <= new Date(m.startDate)) {
      e.endDate = 'La date de fin doit etre apres la date de debut';
    }
    if (m.startDate && new Date(m.startDate) < new Date(this.todayPlus(0))) {
      e.startDate = 'La date de debut ne peut pas etre dans le passe';
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
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/my-rentals']);
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = typeof err?.error === 'string' ? err.error : err?.error?.message;
        this.serverError.set(msg || 'Erreur lors de la creation de la location.');
      },
    });
  }
}
