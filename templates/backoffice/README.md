## coto-angular-template

![Angular](https://img.shields.io/badge/Angular-22.1-DD0031?style=flat&logo=angular) ![Angular Material](https://img.shields.io/badge/Material-22.1-DD0031?style=flat&logo=angular) ![Material Design 3](https://img.shields.io/badge/Material_Design-3-757780?style=flat&logo=materialdesign) ![Keycloak](https://img.shields.io/badge/Keycloak-OIDC-4D4D4D?style=flat&logo=keycloak) ![Zoneless](https://img.shields.io/badge/Zoneless-enabled-DD0031?style=flat&logo=angular)

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
- [Autenticación (Keycloak)](#authentication)
- [API mock y el ejemplo de ABM](#mock-api)
- [Modo oscuro](#dark-mode)
- [Estructura del proyecto](#project-structure)
- [Alias de rutas](#path-aliases)
- [Breakpoints](#breakpoints)
- [Tests unitarios](#unit-tests)
- [Tests E2E con Playwright](#e2e-tests-with-playwright)
- [Deploy](#deploy)

---

<a id="what-is-it"></a>

## ¿Qué es?

Un starter de backoffice (app web privada): una SPA Angular 22 (componentes standalone, signals, zoneless) con un layout principal (header y footer), páginas de inicio y "acerca de", autenticación con Keycloak y un ejemplo de ABM de productos que funciona contra una API mock. Está pensado para copiarse, renombrarse y crecer hasta convertirse en una app real.

**Funciona sin Keycloak.** Hasta que lo configures, la app arranca en **modo demo**: un usuario ficticio ya autenticado y una insignia "Modo demo" en el header. Ver [Autenticación](#authentication).

El tema y la UI compartida (paleta M3, tipografía, breakpoints, componentes) vienen de `@coto-dev/ui-kit`, una librería interna de sistema de diseño que se instala desde el registro privado Nexus; ver [Dependencias](#dependencies).

---

<a id="quick-start"></a>

## Inicio rápido

```bash
nvm use              # Node 24
npm install
npm run mock:api     # terminal 1: API mock en http://localhost:5000
npm start            # terminal 2: app en http://localhost:4200
```

La app abre directo en el layout con un usuario demo. Para iniciar sesión con credenciales reales, ejecutá `npm run configure:keycloak`; ver [Autenticación](#authentication).

---

<a id="stack"></a>

## Stack

| Capa               | Tecnología                                                 |
| ------------------ | ---------------------------------------------------------- |
| Framework          | Angular 22 (standalone, signals, zoneless, OnPush)         |
| UI / Tema          | Angular Material 22 + `@coto-dev/ui-kit` (M3)              |
| Estilos            | SCSS, BEM, mobile-first, CSS custom properties             |
| Autenticación      | Keycloak (OIDC code flow + PKCE) vía `angular-oauth2-oidc` |
| Formularios        | Signal Forms (`@angular/forms/signals`)                    |
| Tests unitarios    | Vitest (vía `@angular/build:unit-test`)                    |
| Tests E2E          | Playwright                                                 |
| Gestor de paquetes | npm                                                        |
| Node               | 24 (ver `.nvmrc`)                                          |

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

| Síntoma                                                     | Causa probable y solución                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm install` no puede resolver `@coto-dev/ui-kit`          | El registro Nexus no es accesible (VPN / red corporativa). Revisá `.npmrc` y tu conexión.                                                   |
| `ERESOLVE` tras cambiar versiones de Angular                | Alguna entrada `@angular/*` tiene otra versión o un `^`. Fijalas todas a la misma versión exacta.                                           |
| `NG0203` / errores de inyección en tests unitarios          | Se resolvió una segunda copia de `@angular/*`. `vitest.config.ts` ya las deduplica; reinstalá `node_modules`.                               |
| La página queda en blanco tras `npm run configure:keycloak` | La URL, el realm o el client id de Keycloak es incorrecto o no es accesible. Revisá la consola del navegador y volvé a ejecutar el comando. |

---

<a id="main-commands"></a>

## Comandos principales

| Comando                      | Descripción                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `npm start`                  | Servidor de desarrollo en `http://localhost:4200` con hot reload (redirige `/api` a la API mock) |
| `npm run mock:api`           | API mock de productos en `http://localhost:5000`; ver [API mock](#mock-api)                      |
| `npm run configure:keycloak` | Define tu configuración de Keycloak y pasa el desarrollo local a Keycloak                        |
| `npm run configure:theme`    | `-- --dark-mode` o `-- --no-dark-mode`: activa o desactiva el botón de tema claro/oscuro         |
| `npm run remove:mock-api`    | Elimina la API mock y pasa el ABM a la fuente de datos JSON (ver API mock)                       |
| `npm run build`              | Build de producción en `dist/`                                                                   |
| `npm run build:dev`          | Build de desarrollo                                                                              |
| `npm run watch`              | Build incremental en modo desarrollo                                                             |
| `npm test`                   | Tests unitarios con Vitest (modo watch)                                                          |
| `npm run lint`               | ESLint (`angular-eslint`) sobre `.ts` y `.html` en `src/`                                        |
| `npm run format`             | Prettier sobre `src/` y `e2e/`                                                                   |
| `npm run test:e2e`           | E2E con Playwright; levanta la API mock y la app (configuración `e2e`) automáticamente           |
| `npm run start:e2e`          | Servidor de desarrollo con la configuración `e2e` (auth demo); lo usa Playwright                 |

Ejecutar un solo spec unitario: `npx ng test --watch=false --include "src/app/**/header.spec.ts"`.

---

<a id="environments"></a>

## Entornos

| Archivo                                | Lo usa                           | `auth.mode`                                                   |
| -------------------------------------- | -------------------------------- | ------------------------------------------------------------- |
| `src/environments/environment.ts`      | `npm start`, `npm run build:dev` | `mock` (demo) hasta que configures Keycloak, luego `keycloak` |
| `src/environments/environment.prod.ts` | `npm run build` (producción)     | `keycloak`                                                    |
| `src/environments/environment.e2e.ts`  | `npm run start:e2e`, Playwright  | `mock`, siempre                                               |

`apiBaseUrl` (por defecto `/api`) es el prefijo que recibe el access token; ver [Autenticación](#authentication). Cada archivo de entorno tiene además dos configuraciones: `api.mode` (`http` o `json`, ver [API mock](#mock-api)) y `theme.darkMode` (ver [Modo oscuro](#dark-mode)).

---

<a id="authentication"></a>

## Autenticación (Keycloak)

La app autentica usuarios con el flujo OIDC Authorization Code y PKCE (`angular-oauth2-oidc`). `authGuard` protege todas las rutas: un usuario no autenticado es enviado al login de Keycloak y vuelve a la página que pidió. `authInterceptor` agrega `Authorization: Bearer <token>` a las requests cuya URL es `apiBaseUrl` o está por debajo, y a ningún otro origen.

### Modo demo (por defecto)

Con `auth.mode: 'mock'`, `MockAuthService` inicia sesión con un "Usuario demo" ficticio, así podés ver y trabajar toda la app sin un servidor Keycloak. El header muestra una insignia **Modo demo** y oculta el botón de logout. **Nunca uses `mock` en un entorno desplegado.**

### Conectar Keycloak

Necesitás tres valores de quien administre tu Keycloak:

| Dato      | Significado                                       | Ejemplo                          |
| --------- | ------------------------------------------------- | -------------------------------- |
| URL       | URL base de Keycloak, la parte antes de `/realms` | `https://keycloak.mycompany.com` |
| Realm     | Nombre del realm                                  | `my-realm`                       |
| Client id | Client id (por defecto, el nombre del proyecto)   | `coto-angular-template`          |

El generador de proyectos puede configurarlos por vos. Más adelante, ejecutá:

```bash
npm run configure:keycloak                      # pregunta cada valor
npm run configure:keycloak -- --url https://keycloak.mycompany.com --realm my-realm --client-id my-app
```

Esto escribe los valores en `src/environments/environment.ts` y `environment.prod.ts` y pasa el desarrollo local a `auth.mode: 'keycloak'`. También podés editar esos archivos a mano. Para volver al modo demo, poné `mode: 'mock'` en `environment.ts`.

### Configuración del client en Keycloak

1. En la consola de administración de Keycloak, creá (o elegí) un realm.
2. Creá un client con el id de arriba: client authentication **desactivado** (client público), standard flow **activado**, método PKCE `S256`.
3. Valid redirect URIs: `http://localhost:4200/*`. Web origins: `http://localhost:4200`.
4. Creá un usuario en el realm y ejecutá `npm start`.

Antes de desplegar, agregá tu URL de producción a los redirect URIs y web origins del client.

### Tests

Los tests unitarios usan `FakeAuthService` de `src/app/core/auth/testing/`. La configuración de build `e2e` siempre usa el usuario demo, así que `npm run test:e2e` no necesita Keycloak.

---

<a id="mock-api"></a>

## API mock y el ejemplo de ABM

`npm run mock:api` levanta una **API mock**, no una API real: un pequeño servidor (`mock/server.mjs`) que simula la API de productos con datos de ejemplo, para que el ABM funcione sin backend. Sirve una API de productos en memoria en `http://localhost:5000`; los datos se reinician al reiniciar el servidor. En desarrollo, `proxy.conf.json` le reenvía `/api` desde el servidor de desarrollo.

| Método   | Ruta                | Descripción |
| -------- | ------------------- | ----------- |
| `GET`    | `/api/products`     | Listar      |
| `GET`    | `/api/products/:id` | Obtener uno |
| `POST`   | `/api/products`     | Crear       |
| `PUT`    | `/api/products/:id` | Actualizar  |
| `DELETE` | `/api/products/:id` | Eliminar    |

La UI de ejemplo vive en `src/app/domains/products/`: un listado (`mat-table`), un formulario de alta/edición hecho con Signal Forms y un diálogo de confirmación de borrado. Para usar un backend real, apuntá `proxy.conf.json` (desarrollo) y el location `/api/` de `nginx.conf` (desplegado) hacia él, y después borrá `mock/`.

### Sin la API mock (fuente de datos JSON)

`api.mode` en `src/environments/environment*.ts` elige de dónde vienen los productos:

- `'http'` (por defecto): `HttpProductsService` llama a `/api/products` (la API mock en desarrollo, tu backend más adelante).
- `'json'`: `JsonProductsService` carga `public/mock/products.json` una vez y aplica el alta, la edición y el borrado **en la memoria del navegador**: no hace falta ningún servidor y los cambios se pierden al recargar la página.

`npm run remove:mock-api` (que también ejecuta el wizard del proyecto si rechazás la API mock) pone `json` en `environment.ts` y `environment.e2e.ts`, borra `mock/`, el proxy de desarrollo y el script `mock:api`, y quita el servidor mock de `playwright.config.ts`. El entorno de producción se queda en `http`: espera un backend real detrás de `/api`. Los productos de ejemplo de `public/mock/products.json` son compartidos por ambos modos.

---

<a id="dark-mode"></a>

## Modo oscuro

`theme.darkMode` en `src/environments/environment*.ts` es `false` por defecto: la app es siempre clara y no muestra el botón. Poné `true` (o ejecutá `npm run configure:theme -- --dark-mode`) para mostrar un botón claro/oscuro en el header. La app arranca en modo claro y el `CotoThemeService` del ui-kit recuerda la elección del usuario. Los estilos oscuros se incluyen en ambos casos (`coto.dark-theme()` en `src/styles.scss`); solo se aplican cuando está la clase `coto-dark-theme`.

---

<a id="project-structure"></a>

## Estructura del proyecto

```
src/app/
  core/
    auth/          contrato AuthService, KeycloakAuthService, MockAuthService, testing/FakeAuthService
    guards/        auth.guard.ts
    interceptors/  auth.interceptor.ts
    services/ models/
  shared/
    layouts/main-layout/        header (usuario, logout, insignia demo, botón de tema) + página enrutada + footer
    components/confirm-dialog/
  domains/
    home/ about/                páginas de ejemplo
    products/                   ejemplo de ABM: models/ services/ (http + json) pages/
  app.routes.ts                 todas las rutas están detrás de authGuard
src/environments/               environment.ts, environment.prod.ts, environment.e2e.ts
mock/server.mjs                 API de productos en memoria (se elimina sin la API mock)
public/mock/products.json       productos de ejemplo compartidos por la API mock y la fuente JSON
scripts/configure-keycloak.mjs  escribe la configuración de Keycloak en los archivos de entorno
scripts/configure-theme.mjs     activa o desactiva el soporte de modo oscuro
scripts/remove-mock-api.mjs     elimina la API mock y pasa a la fuente de datos JSON
e2e/                            specs de Playwright
```

Para agregar una funcionalidad, creá `domains/<nombre>/` y una ruta lazy en `app.routes.ts`. Los archivos y carpetas van en kebab-case; los tipos viven en carpetas `models/`.

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

**Header responsive.** Desde `tablet-portrait` (768px) el header muestra la navegación en línea. Por debajo, un botón hamburguesa (`menu-toggle`) abre un drawer animado con los mismos links y el área de usuario (botón de tema, insignia demo, nombre de usuario, logout). El drawer se cierra al hacer clic en el fondo, con Escape o al activar un link, atrapa el foco mientras está abierto y respeta `prefers-reduced-motion`. Para agregar un link, editá el template compartido `links` en `header.html`: alimenta tanto la navegación en línea como el drawer.

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

Playwright levanta la API mock y la app con la configuración `e2e` (usuario demo, sin Keycloak). Preferí locators accesibles (`getByRole`, `getByLabel`), y después `getByTestId`. `e2e/products.spec.ts` cubre listado, alta, edición y borrado, además de la validación del formulario. El mock guarda el estado en memoria, así que los specs se ejecutan de a uno.

---

<a id="deploy"></a>

## Deploy

- El `Dockerfile` sirve los archivos estáticos compilados con nginx usando `nginx.conf` (antes `npm run build`): `docker build -t coto-angular-template . && docker run -p 8080:80 coto-angular-template`.
- `nginx.conf` redirige a `index.html` en todas las rutas (single-page app), responde `/health` y habilita gzip. Descomentá su location `/api/` y apuntalo a tu backend.
- Definí los valores reales de Keycloak en `src/environments/environment.prod.ts` antes de compilar.
