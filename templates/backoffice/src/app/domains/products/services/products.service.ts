import { Observable } from 'rxjs';
import { Product, ProductInput } from '../models/product.model';

/**
 * Products CRUD contract used by the pages. The app provides `HttpProductsService` or
 * `JsonProductsService` depending on `environment.api.mode`; unit tests provide their own fake.
 */
export abstract class ProductsService {
  /** Lists every product. */
  abstract list(): Observable<Product[]>;

  /**
   * Gets one product.
   * @param {number} id - Product id.
   */
  abstract get(id: number): Observable<Product>;

  /**
   * Creates a product.
   * @param {ProductInput} input - The new product's fields.
   */
  abstract create(input: ProductInput): Observable<Product>;

  /**
   * Replaces a product's fields.
   * @param {number} id - Product id.
   * @param {ProductInput} input - The updated fields.
   */
  abstract update(id: number, input: ProductInput): Observable<Product>;

  /**
   * Deletes a product.
   * @param {number} id - Product id.
   */
  abstract remove(id: number): Observable<void>;
}
