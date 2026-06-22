import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService, OrderDetailsDto, CreateOrderDto } from '../../services/order';
import { StoreProductService, StoreProductDetailsDto } from '../../services/store-product';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.html',
  styleUrl: './orders.scss',
})
export class OrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private cdr = inject(ChangeDetectorRef);
  private storeProductService = inject(StoreProductService);

  storeProducts: StoreProductDetailsDto[] = [];
  orders: OrderDetailsDto[] = [];

  userId = 0;
  storeId = 0;

  isLoading = false;
  successMessage = '';
  errorMessage = '';


  cartItems: {
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    stockSale: number;
  }[] = [];

  selectedProductId = 0;
  selectedQuantity = 1;

  ngOnInit(): void {
    const token = localStorage.getItem('token');

    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));

      this.userId = Number(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']);
      this.storeId = Number(payload['storeId']);
    }

    this.loadOrders();
    this.loadStoreProducts();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.orderService.getOrdersByStore(this.storeId).subscribe({
      next: (data) => {
        this.orders = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur commandes :', error);
        this.errorMessage = 'Impossible de charger les ventes.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
  loadStoreProducts(): void {
    this.storeProductService.getByStore(this.storeId).subscribe({
      next: (data) => {
        this.storeProducts = data.filter(sp => sp.stockSale > 0);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur stocks magasin :', error);
        this.errorMessage = 'Impossible de charger les produits du magasin.';
        this.cdr.detectChanges();
      },
    });
  }
  addToCart(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.selectedProductId === 0) {
      this.errorMessage = 'Veuillez choisir un produit.';
      return;
    }

    if (this.selectedQuantity <= 0) {
      this.errorMessage = 'La quantité doit être supérieure à 0.';
      return;
    }

    const product = this.storeProducts.find(
      sp => sp.productId === Number(this.selectedProductId)
    );

    if (!product) {
      this.errorMessage = 'Produit introuvable dans le magasin.';
      return;
    }

    if (this.selectedQuantity > product.stockSale) {
      this.errorMessage = 'Stock insuffisant.';
      return;
    }

    const existingItem = this.cartItems.find(
      item => item.productId === product.productId
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + Number(this.selectedQuantity);

      if (newQuantity > product.stockSale) {
        this.errorMessage = 'Stock insuffisant pour ce produit.';
        return;
      }

      existingItem.quantity = newQuantity;
    } else {
      this.cartItems.push({
        productId: product.productId,
        productName: product.productName,
        quantity: Number(this.selectedQuantity),
        unitPrice: product.priceSale,
        stockSale: product.stockSale,
      });
    }

    this.selectedProductId = 0;
    this.selectedQuantity = 1;
  }
  createOrder(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.cartItems.length === 0) {
      this.errorMessage = 'Le panier est vide.';
      return;
    }

    if (!confirm('Confirmer la vente ?')) {
      return;
    }

    const dto: CreateOrderDto = {
      storeId: this.storeId,
      userId: this.userId,
      items: this.cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    this.orderService.createOrder(dto).subscribe({
      next: () => {
        this.successMessage = 'Vente créée avec succès.';

        this.cartItems = [];
        this.selectedProductId = 0;
        this.selectedQuantity = 1;

        this.loadOrders();
        this.loadStoreProducts();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur création vente :', error);
        this.errorMessage =
          error.error || 'Impossible de créer la vente. Vérifiez le stock disponible.';
        this.cdr.detectChanges();
      },
    });
  }
  getCartTotal(): number {
    return this.cartItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
  }
}