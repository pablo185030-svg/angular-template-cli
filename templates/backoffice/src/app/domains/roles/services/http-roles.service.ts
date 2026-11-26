import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Role, RoleInput } from '../models/role.model';
import { RolesService } from './roles.service';

/** Roles CRUD against the HTTP API (the mock API in development, a real backend later). */
@Injectable()
export class HttpRolesService extends RolesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/roles`;

  /** @inheritdoc */
  list(): Observable<Role[]> {
    return this.http.get<Role[]>(this.url);
  }

  /** @inheritdoc */
  get(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.url}/${id}`);
  }

  /** @inheritdoc */
  create(input: RoleInput): Observable<Role> {
    return this.http.post<Role>(this.url, input);
  }

  /** @inheritdoc */
  update(id: number, input: RoleInput): Observable<Role> {
    return this.http.put<Role>(`${this.url}/${id}`, input);
  }

  /** @inheritdoc */
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
