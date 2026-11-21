import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Product, ProductInput } from '../models/product.model';
import { ProductsService } from './products.service';

/** Products CRUD against the HTTP API (the mock API in development, a real backend later). */
@Injectable()
export class HttpProductsService extends ProductsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/products`;

  /** @inheritdoc */
  list(): Observable<Product[]> {
    return this.http.get<Product[]>(this.url);
  }

  /** @inheritdoc */
  get(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.url}/${id}`);
  }

  /** @inheritdoc */
  create(input: ProductInput): Observable<Product> {
    return this.http.post<Product>(this.url, input);
  }

  /** @inheritdoc */
  update(id: number, input: ProductInput): Observable<Product> {
    return this.http.put<Product>(`${this.url}/${id}`, input);
  }

  /** @inheritdoc */
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
