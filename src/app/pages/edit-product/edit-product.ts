import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService, CreateProductDto, parseImageUrls } from '../../services/product';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './edit-product.html',
  styleUrl: './edit-product.scss',
})
export class EditProductComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private router = inject(Router);

  productId = signal<number>(0);
  model = signal<CreateProductDto>({
    name: '',
    type: 'Bike',
    priceSale: 0,
    priceRental: null,
    isRentable: false,
    imageUrls: '',
  });

  isLoading = signal(false);
  loadingProduct = signal(true);
  errorMessage = signal<string>('');

  /** Liste parsée des URLs pour la preview galerie. */
  parsedImages() {
    return parseImageUrls(this.model().imageUrls);
  }

  ngOnInit(): void {
    this.productId.set(Number(this.route.snapshot.paramMap.get('id')));
    this.loadProduct();
  }

  loadProduct(): void {
    this.loadingProduct.set(true);
    this.productService.getProductById(this.productId()).subscribe({
      next: (data) => {
        this.model.set({
          name: data.name,
          type: data.type,
          priceSale: data.priceSale,
          priceRental: data.priceRental,
          isRentable: data.isRentable,
          imageUrls: data.imageUrls ?? '',
        });
        this.loadingProduct.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger le produit.');
        this.loadingProduct.set(false);
      },
    });
  }

  set<K extends keyof CreateProductDto>(key: K, value: CreateProductDto[K]): void {
    this.model.update((m) => ({ ...m, [key]: value }));
  }

  onRentableChange(): void {
    const m = this.model();
    if (!m.isRentable) {
      this.set('priceRental', null);
    }
    if (m.isRentable && m.type !== 'Bike') {
      this.set('type', 'Bike');
    }
  }

  onTypeChange(): void {
    const m = this.model();
    if (m.type !== 'Bike') {
      this.set('isRentable', false);
      this.set('priceRental', null);
    }
  }

  onSubmit(): void {
    this.errorMessage.set('');
    this.isLoading.set(true);

    const m = this.model();
    const dto: CreateProductDto = {
      ...m,
      priceRental: m.isRentable ? m.priceRental : null,
    };

    this.productService.updateProduct(this.productId(), dto).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigateByUrl('/back-office/products');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error || 'Impossible de modifier le produit.');
      },
    });
  }
}
