import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService, ProductDetailsDto } from '../../services/product';
import { CartService } from '../../services/cart';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

type Size = 'S' | 'M' | 'L' | 'XL';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private cart = inject(CartService);

  product = signal<ProductDetailsDto | null>(null);
  loading = signal(true);
  errorMsg = signal<string | null>(null);

  selectedSize = signal<Size>('M');
  selectedTab = signal<'description' | 'specs' | 'reviews' | 'shipping'>('description');
  addedToCart = signal(false);

  sizes: Size[] = ['S', 'M', 'L', 'XL'];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (!id) {
        this.router.navigate(['/catalog/1']);
        return;
      }
      this.loadProduct(id);
    });
  }

  private loadProduct(id: number): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.productService.getProductById(id).subscribe({
      next: (p) => {
        this.product.set(p);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('Produit introuvable.');
        this.loading.set(false);
      },
    });
  }

  selectSize(s: Size): void {
    this.selectedSize.set(s);
  }

  selectTab(t: 'description' | 'specs' | 'reviews' | 'shipping'): void {
    this.selectedTab.set(t);
  }

  addToCart(): void {
    const p = this.product();
    if (!p) return;
    this.cart.add({
      productId: p.id,
      name: p.name,
      type: p.type,
      priceSale: p.priceSale,
      size: this.selectedSize(),
      quantity: 1,
    });
    this.addedToCart.set(true);
    setTimeout(() => this.addedToCart.set(false), 2500);
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }
}
