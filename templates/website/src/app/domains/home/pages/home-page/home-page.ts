import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { environment } from '@env/environment';
import { SeoService } from '@core/services/seo.service';

@Component({
  selector: 'app-home-page',
  imports: [MatButtonModule, RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  constructor() {
    const seo = inject(SeoService);
    const siteUrl = seo.absoluteUrl('/');

    // Structured data that identifies the site and the organization behind it, in the HTML the
    // server sends. Replace the organization details with the real ones.
    seo.setJsonLd('site', {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${siteUrl}#website`,
          url: siteUrl,
          name: environment.siteName,
          inLanguage: 'es',
        },
        {
          '@type': 'Organization',
          '@id': `${siteUrl}#organization`,
          url: siteUrl,
          name: environment.siteName,
          logo: seo.absoluteUrl('/coto-logo.svg'),
        },
      ],
    });
  }
}
