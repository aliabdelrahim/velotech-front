import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProductDetailsDto, ProductService, firstImage } from '../../services/product';
import { CatalogService } from '../../services/catalog';
import { StoreService } from '../../services/store';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'name';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, HeaderComponent, FooterComponent],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
})
export class CatalogComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private catalogService = inject(CatalogService);
  private productService = inject(ProductService);
  private storeService = inject(StoreService);
  // Exposition du helper pour le template.
  firstImage = firstImage;
  private i18n = inject(TranslateService);

  /**
   * Mode d'affichage :
   *  - 'global' : /catalog -> tous les produits de tous les magasins
   *  - 'store'  : /catalog/:storeId -> produits d'un magasin specifique
   */
  mode = signal<'global' | 'store'>('global');

  storeId = signal<number | null>(null);
  storeName = signal<string>('');

  products = signal<ProductDetailsDto[]>([]);
  loading = signal(true);
  errorMsg = signal<string | null>(null);

  // -------- Filtres --------
  selectedType = signal<string | null>(null);
  onlyRentable = signal(false);
  priceMin = signal<number>(0);
  priceMax = signal<number>(3000);
  searchTerm = signal<string>('');
  sortKey = signal<SortKey>('relevance');

  availableTypes = computed(() => {
    const set = new Set(this.products().map((p) => p.type));
    return Array.from(set).sort();
  });

  filtered = computed(() => {
    let list = this.products().filter((p) => {
      if (this.selectedType() && p.type !== this.selectedType()) return false;
      if (this.onlyRentable() && !p.isRentable) return false;
      if (p.priceSale < this.priceMin() || p.priceSale > this.priceMax()) return false;
      const q = this.searchTerm().trim().toLowerCase();
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });

    switch (this.sortKey()) {
      case 'price-asc':
        list = [...list].sort((a, b) => a.priceSale - b.priceSale);
        break;
      case 'price-desc':
        list = [...list].sort((a, b) => b.priceSale - a.priceSale);
        break;
      case 'name':
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return list;
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const rawId = params.get('storeId');
      if (rawId) {
        const id = Number(rawId);
        this.mode.set('store');
        this.storeId.set(id);
        this.loadStoreName(id);
        this.loadStoreCatalog(id);
      } else {
        this.mode.set('global');
        this.storeId.set(null);
        this.storeName.set('');
        this.loadGlobalCatalog();
      }
    });
  }

  /** Charge le nom du magasin pour l'affichage (breadcrumb + sous-titre). */
  private loadStoreName(storeId: number): void {
    this.storeService.getById(storeId).subscribe({
      next: (s) => this.storeName.set(s.name),
      error: () => {},
    });
  }

  /**
   * Catalogue global : tous les produits de tous les magasins.
   * Utilise GET /api/products (public).
   */
  private loadGlobalCatalog(): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.productService.getProducts().subscribe({
      next: (list) => {
        this.products.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set(this.i18n.instant('CATALOG.LOAD_ERROR'));
        this.loading.set(false);
      },
    });
  }

  /**
   * Catalogue d'un magasin : uniquement les produits dispos dans ce magasin.
   * Utilise GET /api/catalog/store/{storeId} (public).
   */
  private loadStoreCatalog(storeId: number): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.catalogService.getByStore(storeId).subscribe({
      next: (list) => {
        // Adapte ProductCatalogDto -> ProductDetailsDto pour reutiliser
        // le meme template de card (champ `id` au lieu de `productId`).
        const adapted: ProductDetailsDto[] = list.map((p) => ({
          id: p.productId,
          name: p.name,
          type: p.type,
          priceSale: p.priceSale,
          priceRental: p.priceRental,
          isRentable: p.isRentable,
          imageUrls: p.imageUrls,
        }));
        this.products.set(adapted);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set(this.i18n.instant('CATALOG.LOAD_ERROR'));
        this.loading.set(false);
      },
    });
  }

  toggleType(type: string): void {
    this.selectedType.set(this.selectedType() === type ? null : type);
  }

  resetFilters(): void {
    this.selectedType.set(null);
    this.onlyRentable.set(false);
    this.priceMin.set(0);
    this.priceMax.set(3000);
    this.searchTerm.set('');
    this.sortKey.set('relevance');
  }
}
