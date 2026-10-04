import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProductService, ProductDetailsDto } from '../../services/product';
import { StoreService, StoreDetailsDto } from '../../services/store';
import {
  AppointmentService,
  CreateAppointmentDto,
} from '../../services/appointment';
import { AuthService } from '../../services/auth';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

interface ApptForm {
  storeId: number | null;
  productId: number | null;
  serviceType: string;
  date: string;
  time: string;
  notes: string;
}

interface FieldErrors {
  storeId?: string;
  serviceType?: string;
  date?: string;
  time?: string;
}

const SERVICE_KEYS = [
  'APPT_NEW.SERVICE_REVISION',
  'APPT_NEW.SERVICE_BRAKES',
  'APPT_NEW.SERVICE_DERAILLEUR',
  'APPT_NEW.SERVICE_CHAIN',
  'APPT_NEW.SERVICE_WHEELS',
  'APPT_NEW.SERVICE_ACCESSORIES',
  'APPT_NEW.SERVICE_BATTERY',
  'APPT_NEW.SERVICE_TUNING',
  'APPT_NEW.SERVICE_TIRE',
  'APPT_NEW.SERVICE_SUSPENSION',
];

const HOURS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
];

@Component({
  selector: 'app-appointment-new',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, HeaderComponent, FooterComponent],
  templateUrl: './appointment-new.html',
  styleUrl: './appointment-new.scss',
})
export class AppointmentNewComponent implements OnInit {
  private productService = inject(ProductService);
  private storeService = inject(StoreService);
  private appointmentService = inject(AppointmentService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private i18n = inject(TranslateService);

  serviceKeys = SERVICE_KEYS;
  hours = HOURS;

  stores = signal<StoreDetailsDto[]>([]);
  products = signal<ProductDetailsDto[]>([]);
  loading = signal(true);

  model = signal<ApptForm>({
    storeId: null,
    productId: null,
    serviceType: '',
    date: this.todayPlus(2),
    time: '10:00',
    notes: '',
  });

  errors = signal<FieldErrors>({});
  serverError = signal<string | null>(null);
  submitting = signal(false);

  selectedStore = computed(() => {
    const id = this.model().storeId;
    return id ? this.stores().find((s) => s.id === id) ?? null : null;
  });

  selectedProduct = computed(() => {
    const id = this.model().productId;
    return id ? this.products().find((p) => p.id === id) ?? null : null;
  });

  scheduledAtIso = computed(() => {
    const m = this.model();
    if (!m.date || !m.time) return null;
    return new Date(`${m.date}T${m.time}:00`).toISOString();
  });

  ngOnInit(): void {
    this.storeService.getAll().subscribe({
      next: (s) => this.stores.set(s),
    });
    this.productService.getProducts().subscribe({
      next: (p) => {
        this.products.set(p);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  set<K extends keyof ApptForm>(key: K, value: ApptForm[K]): void {
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
    if (!m.storeId) e.storeId = this.i18n.instant('APPT_NEW.ERR_STORE');
    if (!m.serviceType) e.serviceType = this.i18n.instant('APPT_NEW.ERR_SERVICE');
    if (!m.date) e.date = this.i18n.instant('APPT_NEW.ERR_DATE');
    if (!m.time) e.time = this.i18n.instant('APPT_NEW.ERR_TIME');
    if (m.date && m.time) {
      const dt = new Date(`${m.date}T${m.time}:00`);
      if (dt.getTime() < Date.now()) {
        e.date = this.i18n.instant('APPT_NEW.ERR_DATE_FUTURE');
      }
    }
    return e;
  }

  onSubmit(form: NgForm): void {
    this.serverError.set(null);
    const e = this.validate();
    this.errors.set(e);
    if (Object.keys(e).length > 0) return;

    const userIdStr = this.auth.getUserId();
    if (!userIdStr) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/appointments/new' },
      });
      return;
    }

    const m = this.model();
    const dto: CreateAppointmentDto = {
      userId: Number(userIdStr),
      storeId: m.storeId!,
      productId: m.productId,
      serviceType: m.serviceType,
      scheduledAt: this.scheduledAtIso()!,
      notes: m.notes || null,
    };

    this.submitting.set(true);
    this.appointmentService.create(dto).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/my-appointments']);
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = typeof err?.error === 'string' ? err.error : err?.error?.message;
        this.serverError.set(msg || this.i18n.instant('APPT_NEW.ERR_CREATE'));
      },
    });
  }
}
