/** SEO data a route declares in `data.seo`. The route `title` is the page title. */
export interface RouteSeoData {
  /** Spanish meta description of the page (aim for 70-160 characters). */
  description: string;
  /** Keeps the page out of search results and the sitemap. */
  noindex?: boolean;
  /** Absolute URL of the social sharing image. No image tag is emitted when omitted. */
  image?: string;
}

/** Everything `SeoService` needs to write the head tags of one page. */
export interface SeoPage {
  /** Final document title. */
  title: string;
  description?: string;
  /** URL path of the page (e.g. `/acerca-de`); the canonical URL is built from it. */
  path: string;
  noindex?: boolean;
  image?: string;
}
