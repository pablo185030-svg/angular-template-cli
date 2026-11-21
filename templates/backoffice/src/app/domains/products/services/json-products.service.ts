import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay, tap } from 'rxjs';
import { Product, ProductInput } from '../models/product.model';
import { ProductsService } from './products.service';

/**
 * Products CRUD without a server: loads `mock/products.json` once and applies every change in
 * browser memory. Changes are lost when the page is reloaded. Replace it with
 * `HttpProductsService` (`api.mode: 'http'`) when you have a backend.
 */
@Injectable()
export class JsonProductsService extends ProductsService {
  private readonly http = inject(HttpClient);
  private items: Product[] = [];
  private nextId = 1;

  private readonly loaded$ = this.http.get<Product[]>('mock/products.json').pipe(
    tap((items) => {
      this.items = items.map((item) => ({ ...item }));
      this.nextId = Math.max(0, ...items.map((item) => item.id)) + 1;
    }),
    shareReplay(1),
  );

  /** @inheritdoc */
  list(): Observable<Product[]> {
    return this.loaded$.pipe(map(() => this.items.map((item) => ({ ...item }))));
  }

  /** @inheritdoc */
  get(id: number): Observable<Product> {
    return this.loaded$.pipe(
      map(() => this.items.find((item) => item.id === id)),
      map((item) => {
        if (!item) throw new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
        return { ...item };
      }),
    );
  }

  /** @inheritdoc */
  create(input: ProductInput): Observable<Product> {
    return this.loaded$.pipe(
      map(() => {
        const created = { id: this.nextId++, ...input };
        this.items.push(created);
        return { ...created };
      }),
    );
  }

  /** @inheritdoc */
  update(id: number, input: ProductInput): Observable<Product> {
    return this.loaded$.pipe(
      map(() => {
        const index = this.items.findIndex((item) => item.id === id);
        if (index < 0) throw new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
        this.items[index] = { id, ...input };
        return { ...this.items[index] };
      }),
    );
  }

  /** @inheritdoc */
  remove(id: number): Observable<void> {
    return this.loaded$.pipe(
      map(() => {
        const index = this.items.findIndex((item) => item.id === id);
        if (index < 0) throw new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
        this.items.splice(index, 1);
      }),
    );
  }
}
