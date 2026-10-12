import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProductService, ProductDetailsDto, firstImage } from '../../services/product';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, HeaderComponent, FooterComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private i18n = inject(TranslateService);
  firstImage = firstImage;

  featured = signal<ProductDetailsDto[]>([]);
  loading = signal(true);
  errorMsg = signal<string | null>(null);

  /** Affiche la banniere de confirmation apres suppression de compte RGPD. */
  showAccountDeletedBanner = signal(false);

  ngOnInit(): void {
    // Detection du retour apres suppression de compte (?accountDeleted=1)
    if (this.route.snapshot.queryParamMap.get('accountDeleted') === '1') {
      this.showAccountDeletedBanner.set(true);
      // Auto-dismiss au bout de 10 secondes
      setTimeout(() => this.showAccountDeletedBanner.set(false), 10000);
    }

    this.productService.getProducts().subscribe({
      next: (products) => {
        // On garde les 4 premiers a titre indicatif
        this.featured.set(products.slice(0, 4));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement produits vedette', err);
        this.errorMsg.set(this.i18n.instant('CATALOG.LOAD_ERROR'));
        this.loading.set(false);
      },
    });
  }
}
