import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService, ProductDetailsDto } from '../../services/product';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);

  featured = signal<ProductDetailsDto[]>([]);
  loading = signal(true);
  errorMsg = signal<string | null>(null);

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        // On garde les 4 premiers a titre indicatif
        this.featured.set(products.slice(0, 4));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement produits vedette', err);
        this.errorMsg.set('Impossible de charger les produits vedette.');
        this.loading.set(false);
      },
    });
  }
}
