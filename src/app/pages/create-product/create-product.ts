import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CreateProductDto, ProductService, parseImageUrls } from '../../services/product';

@Component({
  selector: 'app-create-product',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-product.html',
  styleUrl: './create-product.scss',
})
export class CreateProductComponent {
  private productService = inject(ProductService);
  private router = inject(Router);

  model = signal<CreateProductDto>({
    name: '',
    type: 'Accessory',
    priceSale: 0,
    priceRental: null,
    isRentable: false,
    imageUrls: '',
  });

  isLoading = signal(false);
  errorMessage = signal<string>('');

  parsedImages() {
    return parseImageUrls(this.model().imageUrls);
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

    this.productService.createProduct(dto).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigateByUrl('/back-office/products');
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 400) {
          this.errorMessage.set(error.error || 'Données invalides.');
        } else {
          this.errorMessage.set('Impossible de créer le produit.');
        }
      },
    });
  }
}
