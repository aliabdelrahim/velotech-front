import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, HeaderComponent, FooterComponent],
  templateUrl: './order-confirmation.html',
  styleUrl: './order-confirmation.scss',
})
export class OrderConfirmationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private i18n = inject(TranslateService);

  orderId = signal<number>(0);
  orderRef = signal<string>('CMD-2026-0000');

  ngOnInit(): void {
    const idStr = this.route.snapshot.paramMap.get('id') ?? '0';
    const id = Number(idStr);
    this.orderId.set(id);
    const year = new Date().getFullYear();
    const padded = String(id).padStart(4, '0');
    this.orderRef.set(`CMD-${year}-${padded}`);
  }

  get email(): string {
    // Pas d'API user/me pour l'instant — on affiche un placeholder neutre
    return this.i18n.instant('ORDER_CONFIRM.DEFAULT_EMAIL');
  }
}
