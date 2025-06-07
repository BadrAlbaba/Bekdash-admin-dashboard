import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductImageManagerComponent } from './product-image-manager.component';

describe('ProductImageManagerComponent', () => {
  let component: ProductImageManagerComponent;
  let fixture: ComponentFixture<ProductImageManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductImageManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductImageManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
