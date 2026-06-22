import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService, CreateProductDto } from '../../services/product';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-product.html',
})
export class EditProductComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private router = inject(Router);

  productId!: number;

  model: CreateProductDto = {
    name: '',
    type: 'Bike',
    priceSale: 0,
    priceRental: null,
    isRentable: false
  };

  ngOnInit(): void {
    this.productId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProduct();
  }

  loadProduct(): void {
    this.productService.getProductById(this.productId).subscribe({
      next: (data) => {
        this.model = {
          name: data.name,
          type: data.type,
          priceSale: data.priceSale,
          priceRental: data.priceRental,
          isRentable: data.isRentable
        };
      }
    });
  }

  onSubmit(): void {
    this.productService.updateProduct(this.productId, this.model).subscribe({
      next: () => {
        console.log('Produit modifié');
        this.router.navigateByUrl('/products');
      }
    });
  }
}