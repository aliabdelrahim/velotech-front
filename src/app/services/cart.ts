import { Injectable, computed, signal } from '@angular/core';

export interface CartItem {
  productId: number;
  name: string;
  type: string;
  priceSale: number;
  size?: string;
  quantity: number;
}

const STORAGE_KEY = 'velotech_cart';
const SHIPPING_FEE = 9.9;
const FREE_SHIPPING_THRESHOLD = 50;
const VAT_RATE = 0.21;

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private _items = signal<CartItem[]>(this.loadFromStorage());

  readonly items = this._items.asReadonly();

  readonly count = computed(() =>
    this._items().reduce((sum, i) => sum + i.quantity, 0)
  );

  readonly subtotal = computed(() =>
    this._items().reduce((sum, i) => sum + i.priceSale * i.quantity, 0)
  );

  readonly shipping = computed(() =>
    this.subtotal() >= FREE_SHIPPING_THRESHOLD || this.subtotal() === 0
      ? 0
      : SHIPPING_FEE
  );

  readonly vatIncluded = computed(() =>
    +(this.subtotal() * (VAT_RATE / (1 + VAT_RATE))).toFixed(2)
  );

  readonly total = computed(() => +(this.subtotal() + this.shipping()).toFixed(2));

  add(item: CartItem): void {
    const list = [...this._items()];
    const existing = list.find(
      (i) => i.productId === item.productId && i.size === item.size
    );
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      list.push({ ...item });
    }
    this._items.set(list);
    this.persist();
  }

  remove(productId: number, size?: string): void {
    this._items.set(
      this._items().filter(
        (i) => !(i.productId === productId && i.size === size)
      )
    );
    this.persist();
  }

  updateQty(productId: number, qty: number, size?: string): void {
    if (qty <= 0) {
      this.remove(productId, size);
      return;
    }
    const list = this._items().map((i) =>
      i.productId === productId && i.size === size ? { ...i, quantity: qty } : i
    );
    this._items.set(list);
    this.persist();
  }

  clear(): void {
    this._items.set([]);
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._items()));
    } catch {
      /* localStorage indisponible (SSR par ex.) */
    }
  }

  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }
}
