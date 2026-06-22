import { TestBed } from '@angular/core/testing';

import { StoreProduct } from './store-product';

describe('StoreProduct', () => {
  let service: StoreProduct;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StoreProduct);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
