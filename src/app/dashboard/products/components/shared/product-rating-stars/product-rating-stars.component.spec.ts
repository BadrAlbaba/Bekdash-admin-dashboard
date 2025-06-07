import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductRatingStarsComponent } from './product-rating-stars.component';

describe('ProductRatingStarsComponent', () => {
  let component: ProductRatingStarsComponent;
  let fixture: ComponentFixture<ProductRatingStarsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductRatingStarsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductRatingStarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
