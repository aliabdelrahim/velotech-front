import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, ProductDetailsDto } from '../../services/product';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'name';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
})
export class CatalogComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);

  storeId = signal<number>(1);
  storeName = signal<string>('Velotech Ixelles');

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
      const id = Number(params.get('storeId')) || 1;
      this.storeId.set(id);
      this.loadProducts();
    });
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.productService.getProducts().subscribe({
      next: (list) => {
        this.products.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('Impossible de charger le catalogue.');
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
