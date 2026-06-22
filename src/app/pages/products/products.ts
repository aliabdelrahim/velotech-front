import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProductDetailsDto, ProductService } from '../../services/product';


@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class ProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  products: ProductDetailsDto[] = [];
  errorMessage = '';
  isLoading = false;

  ngOnInit(): void {
    this.loadProducts();
  }

editProduct(id: number): void {
  this.router.navigateByUrl(`/products/edit/${id}`);
}

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.productService.getProducts().subscribe({
      next: (data) => {
        console.log('Produits reçus :', data);
        this.products = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur produits :', error);
        this.errorMessage = 'Impossible de charger les produits.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
  deleteProduct(id: number): void {
  const confirmed = window.confirm('Supprimer ce produit ?');

  if (!confirmed) {
    return;
  }
  

  this.productService.deleteProduct(id).subscribe({
    next: () => {
      console.log('Produit supprimé');
      this.loadProducts();
    },
    error: (error) => {
      console.error('Erreur suppression :', error);
      this.errorMessage = 'Impossible de supprimer le produit.';
    },
  });
  
}


}