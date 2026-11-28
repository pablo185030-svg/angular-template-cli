import { DOCUMENT } from '@angular/common';
import { inject, Injectable, Injector } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationStart, Router } from '@angular/router';
import { environment } from '@env/environment';
import { SeoPage } from '@core/models/seo.model';

/** Open Graph locale (language_TERRITORY). Change it to match the site audience. */
const OG_LOCALE = 'es_AR';
const JSON_LD_ATTRIBUTE = 'data-seo-jsonld';

/**
 * The only place that writes SEO tags into the document head: title, description, canonical,
 * Open Graph, Twitter, robots and JSON-LD. Pages declare their data in the route (see
 * `PageTitleStrategy`) and never touch `document` or `<meta>` themselves. It is SSR-safe.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  private readonly injector = inject(Injector);
  private watchingNavigation = false;

  /** Absolute URL for a path of this site, built from `siteUrl`. */
  absoluteUrl(path: string): string {
    const base = environment.siteUrl.replace(/\/+$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  }

  update(page: SeoPage): void {
    this.title.setTitle(page.title);
    this.setMeta('name', 'description', page.description);

    const url = this.absoluteUrl(page.path);
    // A page kept out of the index does not declare itself canonical.
    this.setCanonical(page.noindex ? undefined : url);
    this.setMeta('name', 'robots', page.noindex ? 'noindex' : undefined);

    this.setMeta('property', 'og:title', page.title);
    this.setMeta('property', 'og:description', page.description);
    this.setMeta('property', 'og:url', url);
    this.setMeta('property', 'og:type', 'website');
    this.setMeta('property', 'og:locale', OG_LOCALE);
    this.setMeta('property', 'og:site_name', environment.siteName);
    this.setMeta('property', 'og:image', page.image);

    this.setMeta('name', 'twitter:card', page.image ? 'summary_large_image' : 'summary');
    this.setMeta('name', 'twitter:title', page.title);
    this.setMeta('name', 'twitter:description', page.description);
    this.setMeta('name', 'twitter:image', page.image);
  }

  /**
   * Adds the JSON-LD block `id` for the current page, replacing a block with the same id (such as
   * the one the server rendered, so hydration never duplicates it). Blocks are removed when the
   * next navigation starts.
   */
  setJsonLd(id: string, data: Record<string, unknown>): void {
    this.clearJsonLdOnNavigation();
    this.document.head.querySelector(`script[${JSON_LD_ATTRIBUTE}="${id}"]`)?.remove();

    const script = this.document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute(JSON_LD_ATTRIBUTE, id);
    // `<` is escaped so page data can never close the script element.
    script.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
    this.document.head.appendChild(script);
  }

  clearJsonLd(): void {
    this.document.head.querySelectorAll(`script[${JSON_LD_ATTRIBUTE}]`).forEach((s) => s.remove());
  }

  /**
   * JSON-LD belongs to the page that added it, so it is dropped when a navigation starts. The
   * router is resolved lazily: `SeoService` is created by the title strategy, which the router
   * itself needs, so injecting `Router` in the constructor would be a circular dependency.
   */
  private clearJsonLdOnNavigation(): void {
    if (this.watchingNavigation) return;
    this.watchingNavigation = true;
    this.injector.get(Router).events.subscribe((event) => {
      if (event instanceof NavigationStart) this.clearJsonLd();
    });
  }

  private setMeta(attribute: 'name' | 'property', key: string, content: string | undefined): void {
    const selector = `${attribute}="${key}"`;
    if (content) {
      this.meta.updateTag({ [attribute]: key, content }, selector);
    } else {
      this.meta.removeTag(selector);
    }
  }

  private setCanonical(url: string | undefined): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!url) {
      link?.remove();
      return;
    }
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
