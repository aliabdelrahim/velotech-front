import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CreateProductDto, ProductService } from '../../services/product';

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

  model: CreateProductDto = {
    name: '',
    type: 'Accessory',
    priceSale: 0,
    priceRental: null,
    isRentable: false,
  };

  isLoading = false;
  errorMessage = '';

  onRentableChange(): void {
    if (!this.model.isRentable) {
      this.model.priceRental = null;
    }

    if (this.model.isRentable && this.model.type !== 'Bike') {
      this.model.type = 'Bike';
    }
  }

  onTypeChange(): void {
    if (this.model.type !== 'Bike') {
      this.model.isRentable = false;
      this.model.priceRental = null;
    }
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.isLoading = true;

    const dto: CreateProductDto = {
      ...this.model,
      priceRental: this.model.isRentable ? this.model.priceRental : null,
    };

    this.productService.createProduct(dto).subscribe({
      next: (createdProduct) => {
        console.log('Produit créé :', createdProduct);
        this.isLoading = false;
        this.router.navigateByUrl('/products');
      },
      error: (error) => {
        console.error('Erreur création produit :', error);
        this.isLoading = false;

        if (error.status === 400) {
          this.errorMessage = error.error || 'Données invalides.';
        } else {
          this.errorMessage = 'Impossible de créer le produit.';
        }
      },
    });
  }
}