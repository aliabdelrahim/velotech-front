import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreProducts } from './store-products';

describe('StoreProducts', () => {
  let component: StoreProducts;
  let fixture: ComponentFixture<StoreProducts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoreProducts],
    }).compileComponents();

    fixture = TestBed.createComponent(StoreProducts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
