## coto-angular-template

![Angular](https://img.shields.io/badge/Angular-22.1-DD0031?style=flat&logo=angular) ![Angular Material](https://img.shields.io/badge/Material-22.1-DD0031?style=flat&logo=angular) ![Material Design 3](https://img.shields.io/badge/Material_Design-3-757780?style=flat&logo=materialdesign) ![SSR](https://img.shields.io/badge/SSR-@angular/ssr-DD0031?style=flat&logo=angular) ![Zoneless](https://img.shields.io/badge/Zoneless-enabled-DD0031?style=flat&logo=angular)

![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat&logo=typescript) ![Node](https://img.shields.io/badge/Node-24-339933?style=flat&logo=node.js) ![npm](https://img.shields.io/badge/npm-package_manager-CB3837?style=flat&logo=npm)

![Vitest](https://img.shields.io/badge/Vitest-4.0-6E9F18?style=flat&logo=vitest) ![Playwright](https://img.shields.io/badge/Playwright-1.61-2EAD33?style=flat&logo=playwright) ![ESLint](https://img.shields.io/badge/ESLint-enabled-4B32C3?style=flat&logo=eslint) ![Prettier](https://img.shields.io/badge/Prettier-enabled-F7B93E?style=flat&logo=prettier)

> 🌐 **Español** · [English](README.en.md)

## Tabla de contenidos

- [¿Qué es?](#what-is-it)
- [Inicio rápido](#quick-start)
- [Stack](#stack)
- [Requisitos](#requirements)
- [Instalación](#installation)
- [Dependencias](#dependencies)
- [Solución de problemas](#troubleshooting)
- [Comandos principales](#main-commands)
- [Entornos](#environments)
- [Renderizado del lado del servidor](#server-side-rendering)
- [SEO, GEO y calidad web](#seo-geo-and-web-quality)
- [Estructura del proyecto](#project-structure)
- [Alias de rutas](#path-aliases)
- [Breakpoints](#breakpoints)
- [Tests unitarios](#unit-tests)
- [Tests E2E con Playwright](#e2e-tests-with-playwright)
- [Deploy](#deploy)

---

<a id="what-is-it"></a>

## ¿Qué es?

Un starter de sitio web público: una app Angular 22 (componentes standalone, signals, zoneless, SSR) con un layout principal (header y footer), una página de inicio, una página "acerca de" y una página de no encontrado. Está pensado para copiarse, renombrarse y crecer hasta convertirse en un sitio real.

El tema y la UI compartida (paleta M3, tipografía, breakpoints, componentes) vienen de `@coto-dev/ui-kit`, una librería interna de sistema de diseño que se instala desde el registro privado Nexus; ver [Dependencias](#dependencies).

---

<a id="quick-start"></a>

## Inicio rápido

```bash
nvm use            # Node 24
npm install
npm start          # app en http://localhost:4200
```

---

<a id="stack"></a>

## Stack

| Capa               | Tecnología                                         |
| ------------------ | -------------------------------------------------- |
| Framework          | Angular 22 (standalone, signals, zoneless, OnPush) |
| UI / Tema          | Angular Material 22 + `@coto-dev/ui-kit` (M3)      |
| Estilos            | SCSS, BEM, mobile-first, CSS custom properties     |
| SSR                | `@angular/ssr` + Express                           |
| Tests unitarios    | Vitest (vía `@angular/build:unit-test`)            |
| Tests E2E          | Playwright                                         |
| Gestor de paquetes | npm                                                |
| Node               | 24 (ver `.nvmrc`)                                  |

---

<a id="requirements"></a>

## Requisitos

- Node 24 (ver `.nvmrc`; recomendado usar `nvm` → `nvm use`).
- npm: viene incluido con Node.
- Acceso de red al registro privado Nexus que sirve `@coto-dev/ui-kit`.

---

<a id="installation"></a>

## Instalación

```bash
nvm use
npm install
```

`prepare` instala el hook de pre-commit de Husky, que ejecuta `lint-staged` (ESLint + Prettier sobre los archivos en staging). Requiere que el proyecto sea un repositorio git.

---

<a id="dependencies"></a>

## Dependencias

El proyecto versiona un único lockfile, `package-lock.json`, así que en CI instalá con `npm ci`.

### Por qué todos los paquetes de Angular están fijados a la misma versión exacta

Cada entrada `@angular/*` de `package.json` está fijada a la misma versión exacta (sin `^`). Los paquetes de Angular declaran dependencias peer exactas entre sí, por lo que deben avanzar juntos; mezclar versiones fijas y con rango falla con `ERESOLVE` la próxima vez que se resuelva el árbol tras un parche de Angular. Para actualizar, cambiá la versión de todas las entradas `@angular/*` a la vez y ejecutá `npm install`. No uses un bloque `overrides` para ellas.

### `@coto-dev/ui-kit`: se instala desde el registro privado Nexus

- `.npmrc` apunta el scope `@coto-dev` al registro privado, así que el registro debe estar accesible desde tu red al ejecutar `npm install`. No contiene credenciales.
- Para actualizar la librería, editá su rango en `package.json` y ejecutá `npm install`. No la consumas como dependencia git ni como tarball local.
- Antes de usar uno de sus componentes, revisá su API en `node_modules/@coto-dev/ui-kit/types/*.d.ts`.
- La app nunca define su propia paleta de colores: `src/styles.scss` llama a `coto.theme()` una sola vez y todo lee `var(--mat-sys-*)`.

---

<a id="troubleshooting"></a>

## Solución de problemas

| Síntoma                                            | Causa probable y solución                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `npm install` no puede resolver `@coto-dev/ui-kit` | El registro Nexus no es accesible (VPN / red corporativa). Revisá `.npmrc` y tu conexión.                     |
| `ERESOLVE` tras cambiar versiones de Angular       | Alguna entrada `@angular/*` tiene otra versión o un `^`. Fijalas todas a la misma versión exacta.             |
| `NG0203` / errores de inyección en tests unitarios | Se resolvió una segunda copia de `@angular/*`. `vitest.config.ts` ya las deduplica; reinstalá `node_modules`. |
| SSR responde con un error de host                  | Agregá el hostname a `ssr.allowedHosts`; ver [Renderizado del lado del servidor](#server-side-rendering).     |

---

<a id="main-commands"></a>

## Comandos principales

| Comando                       | Descripción                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `npm start`                   | Servidor de desarrollo en `http://localhost:4200` con hot reload                                                                |
| `npm run build`               | Build de producción (navegador + servidor SSR) en `dist/`                                                                       |
| `npm run build:dev`           | Build de desarrollo                                                                                                             |
| `npm run watch`               | Build incremental en modo desarrollo                                                                                            |
| `npm run serve:ssr`           | Ejecuta el servidor SSR compilado (`PORT`, por defecto 4000); requiere un `npm run build` previo                                |
| `npm test`                    | Tests unitarios con Vitest (modo watch)                                                                                         |
| `npm run lint`                | ESLint (`angular-eslint`) sobre `.ts` y `.html` en `src/`                                                                       |
| `npm run format`              | Prettier sobre `src/` y `e2e/`                                                                                                  |
| `npm run test:e2e`            | E2E con Playwright; levanta el servidor de desarrollo automáticamente                                                           |
| `npm run configure:rendering` | `-- --mode ssg` o `-- --mode spa`: convierte el proyecto SSR a otro modo de renderizado                                         |
| `npm run configure:seo`       | `-- --site-url https://tu-dominio.com`: define la URL pública en los environments y en `robots.txt`, `sitemap.xml` y `llms.txt` |
| `npm run configure:theme`     | `-- --dark-mode` o `-- --no-dark-mode`: activa o desactiva el botón de tema claro/oscuro                                        |

Ejecutar un solo spec unitario: `npx ng test --watch=false --include "src/app/**/header.spec.ts"`.

---

<a id="environments"></a>

## Entornos

`src/environments/environment.ts` lo usa `npm start`; `environment.prod.ts` lo reemplaza en el build de producción (`fileReplacements` en `angular.json`). Agregá un archivo nuevo y una configuración de build si necesitás otro entorno.

`theme.darkMode` (por defecto `false`) es la configuración del modo oscuro: con `false` el sitio es siempre claro y no muestra el botón; con `true` (o tras `npm run configure:theme -- --dark-mode`) el header muestra un botón claro/oscuro, el sitio arranca en modo claro y el `CotoThemeService` del ui-kit recuerda la elección. Los estilos oscuros siempre están incluidos (`coto.dark-theme()` en `src/styles.scss`) y solo se aplican con la clase `coto-dark-theme`.

---

<a id="server-side-rendering"></a>

## Renderizado del lado del servidor

`src/server.ts` es el punto de entrada de Express; `src/app/app.routes.server.ts` define el modo de renderizado por ruta (por defecto todo se renderiza en el servidor).

`@angular/ssr` rechaza por defecto cualquier header `Host`, para evitar la inyección de host. **Agregá tus hostnames públicos a `ssr.allowedHosts`** en `src/environments/environment.prod.ts` antes de desplegar. `/health` responde `200 ok` sin renderizar, para probes de liveness.

---

<a id="seo-geo-and-web-quality"></a>

## SEO, GEO y calidad web

El template viene listo para buscadores y para motores de respuesta con IA (GEO), y cumple lo que Google recomienda en accesibilidad, imágenes y rendimiento.

- **URL del sitio**: `siteUrl` en `src/environments/environment*.ts` (placeholder `https://www.example.com`). Cambialo con `npm run configure:seo -- --site-url https://www.tu-dominio.com`: actualiza los environments, `robots.txt`, `sitemap.xml` y `llms.txt`. Si generaste el proyecto con el wizard y diste el dominio (`--site-url`), ya está hecho.
- **Dominio de ejemplo bloqueado**: `npm run build` ejecuta antes `scripts/check-seo.mjs`, que falla si `environment.prod.ts`, `robots.txt`, `sitemap.xml` o `llms.txt` siguen con `example.com`, `example.org` o `example.net`, y dice qué archivos corregir. `npm start`, `npm test` y `npm run build:dev` no se ven afectados. Solo para pruebas o pipelines que no publican, `ALLOW_PLACEHOLDER_SITE_URL=1` omite el chequeo.
- **Metadatos por ruta**: cada ruta declara `title` y `data: { seo: { description } }` en `app.routes.ts`. `PageTitleStrategy` y `SeoService` escriben título (`<página> | <siteName>`), descripción, canonical, Open Graph, Twitter y `robots`, tanto en el HTML del servidor como al navegar. Una ruta con `noindex: true` no emite canonical y queda fuera del sitemap.
- **Archivos para crawlers** (`public/`): `robots.txt` permite todos los crawlers, incluidos los de IA; para bloquear uno, agregá un bloque (`User-agent: GPTBot` + `Disallow: /`). `sitemap.xml` lista las rutas indexables y un test falla si falta alguna. `llms.txt` resume el sitio para modelos de lenguaje; es opcional y su efecto en los buscadores no está probado.
- **Datos estructurados**: la home emite JSON-LD de `WebSite` y `Organization`. Cada página puede agregar el suyo con `SeoService.setJsonLd(id, datos)`.
- **404 real**: con SSR, una ruta desconocida responde HTTP 404 con la página de no encontrado y `noindex`. En SSG y SPA el hosting responde 200 (limitación de los hosts estáticos); `noindex` se mantiene.
- **Accesibilidad**: enlace "Saltar al contenido", un único `h1` por página y un test E2E con axe (WCAG 2.2 AA) que revisa cada página del sitemap en 320px y 1280px y el drawer abierto.
- **Imágenes**: usá `NgOptimizedImage` (`ngSrc`) con `width` y `height`; el lint falla con un `<img src>` común. `priority` solo en la imagen más grande visible sin hacer scroll (LCP); el resto carga de forma diferida. Preferí AVIF/WebP y siempre un `alt` en español (vacío si es decorativa).
- **Rendimiento y seguridad**: assets con hash cacheados un año, HTML sin caché, y los headers `X-Content-Type-Options`, `Referrer-Policy` y `X-Frame-Options` en el servidor Node y en nginx.

Para agregar una página que cumpla todo esto: ruta con `title` y `description`, entrada en `sitemap.xml`, un solo `h1`, imágenes con `ngSrc` y, si corresponde, JSON-LD. Los tests y el lint avisan si algo falta. La carpeta `.agents/skills/web-quality-review` incluye una skill para agentes de IA que audita todo esto bajo demanda (con Lighthouse opcional); como complemento opcional existen skills de la comunidad como [claude-seo](https://github.com/AgriciDaniel/claude-seo) o [tvl-seo-geo-audit](https://academy.tvl.tech/en/skills/tvl-seo-geo-audit/), que no se incluyen en el template.

---

<a id="project-structure"></a>

## Estructura del proyecto

```
src/app/
  core/         singletons de toda la app: guards/ interceptors/ services/ models/
  shared/       reutilizable entre dominios
    layouts/main-layout/   header + página enrutada + footer
    pages/not-found-page/
  domains/      una carpeta por área funcional
    home/pages/home-page/
    about/pages/about-page/
  app.routes.ts          layout principal con rutas hijas '', 'acerca-de' y un not-found '**'
  app.routes.server.ts   modo de renderizado SSR por ruta
src/environments/        environment.ts, environment.prod.ts (hosts SSR, theme.darkMode)
src/server.ts            servidor SSR con Express
public/                  robots.txt, sitemap.xml, llms.txt, favicon y logo
src/app/core/services/   SeoService y PageTitleStrategy (metadatos SEO por ruta)
e2e/                     specs de Playwright
```

Para agregar una funcionalidad, creá `domains/<nombre>/pages/<nombre>-page/` y una ruta lazy en `app.routes.ts`. Los archivos y carpetas van en kebab-case; los tipos viven en carpetas `models/`.

### Agentes de IA

Este proyecto funciona con cualquier agente de IA para programar (Claude Code, Codex, Cursor, GitHub Copilot, Gemini CLI y otros), no solo con Claude:

- `AGENTS.md` tiene las instrucciones del proyecto (comandos, convenciones y reglas). Es el archivo que leen la mayoría de los agentes; editá este.
- `CLAUDE.md` solo contiene `@AGENTS.md`, para que Claude Code lea las mismas instrucciones.
- `.agents/skills/` guarda los skills del proyecto (`web-quality-review` y, si lo elegiste al generar, `angular-developer`). `.claude/skills/` son enlaces a esa carpeta para Claude Code.

Si tu agente no soporta skills, `AGENTS.md` indica leer `.agents/skills/web-quality-review/SKILL.md` como una guía de auditoría común.


---

<a id="path-aliases"></a>

## Alias de rutas

`tsconfig.json` define alias de rutas para que los imports no dependan de rutas relativas largas:

| Alias        | Ruta                 | Ejemplo                                                                 |
| ------------ | -------------------- | ----------------------------------------------------------------------- |
| `@app/*`     | `src/app/*`          | `import { routes } from '@app/app.routes';`                             |
| `@core/*`    | `src/app/core/*`     | `import { authGuard } from '@core/guards/auth.guard';`                  |
| `@shared/*`  | `src/app/shared/*`   | `import { MainLayout } from '@shared/layouts/main-layout/main-layout';` |
| `@domains/*` | `src/app/domains/*`  | `import { HomePage } from '@domains/home/pages/home-page/home-page';`   |
| `@env/*`     | `src/environments/*` | `import { environment } from '@env/environment';`                       |

Funcionan en el servidor de desarrollo, el build y los tests unitarios sin configuración extra.

---

<a id="breakpoints"></a>

## Breakpoints

Los breakpoints vienen de `@coto-dev/ui-kit`, así que SCSS y TypeScript comparten los mismos umbrales. El sistema de diseño es **mobile-first**: escribí los estilos base para la pantalla más chica y agregá las variantes hacia arriba.

**Header responsive.** Desde `tablet-portrait` (768px) el header muestra la navegación en línea. Por debajo, un botón hamburguesa (`menu-toggle`) abre un drawer animado con los mismos links (y el botón de tema si el modo oscuro está activo). El drawer se cierra al hacer clic en el fondo, con Escape o al activar un link, atrapa el foco mientras está abierto y respeta `prefers-reduced-motion`. Para agregar un link, editá el template compartido `links` en `header.html`: alimenta tanto la navegación en línea como el drawer.

| Nombre del breakpoint | Ancho mínimo |
| --------------------- | ------------ |
| `mobile`              | 320px        |
| `tablet-portrait`     | 768px        |
| `tablet-landscape`    | 1024px       |
| `desktop-small`       | 1366px       |
| `desktop-large`       | 1920px       |

```scss
@use '@coto-dev/ui-kit/styles' as coto;

.card {
  padding: 1rem; // mobile (base, sin query)

  @include coto.breakpoint-up(tablet-landscape) {
    padding: 2rem;
  }
}
```

Desde TypeScript usá la constante `COTO_BREAKPOINTS` (por ejemplo con `BreakpointObserver`).

---

<a id="unit-tests"></a>

## Tests unitarios

Vitest a través del builder `@angular/build:unit-test` de Angular. Los specs viven junto al código como `*.spec.ts` y no requieren registro. Seleccioná elementos con `data-testid`, no con clases CSS. Ejecutá todo con `npm test`, o un solo spec con `--include` (ver [Comandos principales](#main-commands)).

---

<a id="e2e-tests-with-playwright"></a>

## Tests E2E con Playwright

```bash
npx playwright install chromium   # solo la primera vez
npm run test:e2e
```

Playwright levanta el servidor de desarrollo por sí mismo (`playwright.config.ts`). Preferí locators accesibles (`getByRole`, `getByLabel`), y después `getByTestId`. El ejemplo en `e2e/home.spec.ts` visita la home, navega a "acerca de" y verifica el layout.

---

<a id="deploy"></a>

## Deploy

- (SSR) El `Dockerfile` ejecuta el servidor SSR compilado (antes `npm run build`): `docker build -t coto-angular-template . && docker run -p 4000:4000 coto-angular-template`.
- `nginx.conf` es un reverse proxy opcional que sirve los assets estáticos desde disco y reenvía todo lo demás al servidor Node. Es un bloque `server{}` completo, para colocar en `/etc/nginx/conf.d/default.conf`.
