import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductService, ProductDetailsDto, firstImage } from '../../../services/product';

@Component({
  selector: 'app-bo-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './bo-products.html',
  styleUrl: '../bo-orders/bo-orders.scss',
})
export class BoProductsComponent implements OnInit {
  private productService = inject(ProductService);
  firstImage = firstImage;

  products = signal<ProductDetailsDto[]>([]);
  loading = signal(true);
  errorMsg = signal<string | null>(null);
  searchTerm = signal('');
  typeFilter = signal<string>('all');

  types = computed(() => {
    const set = new Set<string>(this.products().map((p) => p.type));
    return ['all', ...Array.from(set).sort()];
  });

  filtered = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    const t = this.typeFilter();
    return this.products().filter((p) => {
      if (t !== 'all' && p.type !== t) return false;
      if (!q) return true;
      return (
        String(p.id).includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q)
      );
    });
  });

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: (list) => {
        this.products.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('Impossible de charger les produits.');
        this.loading.set(false);
      },
    });
  }

  deleteProduct(p: ProductDetailsDto): void {
    if (!confirm(`Supprimer ${p.name} ?`)) return;
    this.productService.deleteProduct(p.id).subscribe({
      next: () => {
        this.products.update((list) => list.filter((x) => x.id !== p.id));
      },
      error: () => alert('Erreur de suppression.'),
    });
  }
}
