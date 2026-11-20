import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Product, ProductInput } from '../models/product.model';

/** CRUD access to the products API. */
@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/products`;

  /** Lists every product. */
  list(): Observable<Product[]> {
    return this.http.get<Product[]>(this.url);
  }

  /**
   * Gets one product.
   * @param {number} id - Product id.
   */
  get(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.url}/${id}`);
  }

  /**
   * Creates a product.
   * @param {ProductInput} input - The new product's fields.
   */
  create(input: ProductInput): Observable<Product> {
    return this.http.post<Product>(this.url, input);
  }

  /**
   * Replaces a product's fields.
   * @param {number} id - Product id.
   * @param {ProductInput} input - The updated fields.
   */
  update(id: number, input: ProductInput): Observable<Product> {
    return this.http.put<Product>(`${this.url}/${id}`, input);
  }

  /**
   * Deletes a product.
   * @param {number} id - Product id.
   */
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
