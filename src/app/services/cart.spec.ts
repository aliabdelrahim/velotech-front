import { TestBed } from '@angular/core/testing';
import { CartService, CartItem } from './cart';

function item(over: Partial<CartItem> = {}): CartItem {
  return {
    productId: 1,
    name: 'Velo route RC120',
    type: 'Bike',
    priceSale: 799,
    quantity: 1,
    ...over,
  };
}

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [CartService] });
    service = TestBed.inject(CartService);
  });

  afterEach(() => localStorage.clear());

  it('should be created and empty', () => {
    expect(service).toBeTruthy();
    expect(service.items().length).toBe(0);
    expect(service.count()).toBe(0);
    expect(service.subtotal()).toBe(0);
    expect(service.shipping()).toBe(0);
    expect(service.total()).toBe(0);
  });

  it('add() pushes a new item', () => {
    service.add(item());
    expect(service.items().length).toBe(1);
    expect(service.count()).toBe(1);
    expect(service.subtotal()).toBe(799);
  });

  it('add() of same productId merges quantities', () => {
    service.add(item({ quantity: 1 }));
    service.add(item({ quantity: 2 }));
    expect(service.items().length).toBe(1);
    expect(service.items()[0].quantity).toBe(3);
    expect(service.count()).toBe(3);
  });

  it('add() distinguishes items by size', () => {
    service.add(item({ size: 'S' }));
    service.add(item({ size: 'M' }));
    expect(service.items().length).toBe(2);
  });

  it('remove() drops a specific item', () => {
    service.add(item({ productId: 1 }));
    service.add(item({ productId: 2, name: 'Casque', priceSale: 49 }));
    service.remove(1);
    expect(service.items().length).toBe(1);
    expect(service.items()[0].productId).toBe(2);
  });

  it('updateQty() updates a specific item', () => {
    service.add(item());
    service.updateQty(1, 5);
    expect(service.items()[0].quantity).toBe(5);
    expect(service.subtotal()).toBe(799 * 5);
  });

  it('updateQty() with qty <= 0 removes the item', () => {
    service.add(item());
    service.updateQty(1, 0);
    expect(service.items().length).toBe(0);
  });

  it('shipping is free above 50 EUR threshold', () => {
    service.add(item({ priceSale: 100 })); // 100 EUR > 50
    expect(service.shipping()).toBe(0);
  });

  it('shipping is charged below 50 EUR threshold', () => {
    service.add(item({ priceSale: 30 }));
    expect(service.shipping()).toBeGreaterThan(0);
  });

  it('shipping is 0 when cart is empty', () => {
    expect(service.shipping()).toBe(0);
  });

  it('total = subtotal + shipping', () => {
    service.add(item({ priceSale: 30 }));
    expect(service.total()).toBe(service.subtotal() + service.shipping());
  });

  it('clear() empties the cart', () => {
    service.add(item());
    service.add(item({ productId: 2, name: 'Casque', priceSale: 49 }));
    service.clear();
    expect(service.items().length).toBe(0);
  });

  it('persists state across instances via localStorage', () => {
    service.add(item({ priceSale: 100, quantity: 2 }));

    // Recree une nouvelle instance : doit charger l'etat
    const second = TestBed.runInInjectionContext(() => new CartService());
    expect(second.items().length).toBe(1);
    expect(second.subtotal()).toBe(200);
  });
});
