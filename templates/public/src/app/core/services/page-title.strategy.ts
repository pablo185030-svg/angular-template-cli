import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { environment } from '@env/environment';
import { RouteSeoData } from '@core/models/seo.model';
import { SeoService } from './seo.service';

/**
 * Builds `<route title> | <site name>` and writes every SEO tag of the activated route through
 * `SeoService`. Routes only declare `title` and `data: { seo: { description } }`.
 */
@Injectable({ providedIn: 'root' })
export class PageTitleStrategy extends TitleStrategy {
  private readonly seo = inject(SeoService);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot);
    const data = this.seoData(snapshot.root);

    this.seo.update({
      title: pageTitle ? `${pageTitle} | ${environment.siteName}` : environment.siteName,
      description: data?.description,
      noindex: data?.noindex,
      image: data?.image,
      path: snapshot.url.split(/[?#]/)[0] || '/',
    });
  }

  /** The `seo` data of the deepest route that declares it. */
  private seoData(route: ActivatedRouteSnapshot): RouteSeoData | undefined {
    let found: RouteSeoData | undefined;
    for (
      let current: ActivatedRouteSnapshot | null = route;
      current;
      current = current.firstChild
    ) {
      found = (current.data['seo'] as RouteSeoData | undefined) ?? found;
    }
    return found;
  }
}
