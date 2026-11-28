# angular-template-cli

![Angular](https://img.shields.io/badge/Angular-22-DD0031?style=flat&logo=angular) ![Node](https://img.shields.io/badge/Node-24-339933?style=flat&logo=node.js)

> 🌐 **Español** · [English](README.en.md)

Dos templates de proyecto Angular 22 listos para usar en apps de Coto, con estilos de `@coto-dev/ui-kit`, y un wizard por CLI que genera un proyecto nuevo a partir de cualquiera de ellos.

| Template               | Qué es                                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `templates/public`     | Sitio web público. Renderizado en el servidor, layout principal (header + footer), páginas de inicio y "acerca de". |
| `templates/backoffice` | App web privada. SPA, login con Keycloak, mismo layout y páginas, más un ABM de productos.                          |

Ambos son apps zoneless con componentes standalone, con ESLint, Prettier, Vitest, Husky + lint-staged, un Dockerfile y configuración de nginx, y ejemplos de e2e con Playwright. Cada template es un proyecto Angular normal que compila y se testea por sí solo.

## Tabla de contenidos

- [Requisitos](#requirements)
- [Crear un proyecto](#create-a-project)
- [Desarrollar los templates](#develop-the-templates)
- [Estructura del repositorio](#repository-layout)

---

<a id="requirements"></a>

## Requisitos

- Node.js 24 (ver `.nvmrc` en cada template) y npm.
- Acceso de red al registro privado Nexus que sirve `@coto-dev/ui-kit`. Cada template trae un `.npmrc` que apunta el scope `@coto-dev` a ese registro; no hacen falta credenciales.

<a id="create-a-project"></a>

## Crear un proyecto

Este repositorio no está publicado: clonalo y ejecutá el wizard desde el clon.

```bash
git clone <url-de-este-repo> angular-template-cli
cd angular-template-cli
npm install --prefix cli     # una sola vez
npm run create               # wizard guiado
```

El wizard copia el template en una carpeta **junto a este repositorio** (hermana, no dentro), la renombra e inicia un repositorio git nuevo en `main`. Te va preguntando:

**Para todos los proyectos**

- **Tipo de app y nombre** del proyecto.
- **Dónde crearlo** (por defecto, junto a este repositorio).
- **Repositorio git existente**: si ya tenés uno, se conecta como `origin`. No se hace push; el resumen muestra el comando `git push`.
- **Commit inicial** (por defecto, sí).
- **Instalar dependencias ahora** (por defecto, no). Requiere acceso al registro privado de `@coto-dev/ui-kit`; si falla, el proyecto no se aborta ni se borra.
- **Modo oscuro** (por defecto, no: solo tema claro). Si lo activás, el header suma un botón claro/oscuro y la app arranca en claro.

**Solo backoffice**

- **Keycloak** (URL, realm y client id). Si lo salteás, arranca en modo demo, con pantalla de login y un usuario de prueba (`admin`, contraseña `1234`, solo para entornos locales), y lo conectás después con `npm run configure:keycloak`.
- **API mock**: un servidor local que simula la API de productos para que el ABM funcione sin backend. Si no la incluís, el ABM carga los productos de un archivo JSON y los cambios se pierden al recargar.

**Solo sitio público**

- **Modo de renderizado**: SSR (por defecto, servidor Node), SSG (páginas estáticas prerenderizadas) o SPA (solo cliente, sin SEO). Se aplica con `npm run configure:rendering` dentro del proyecto generado.

Los textos del wizard están en español. Presioná **Esc para volver** a la pregunta anterior o **Ctrl+C para salir** (no se escribe nada). Después:

```bash
cd ../<nombre-del-proyecto>
npm install
npm start                    # backoffice con API mock: ejecutá también `npm run mock:api` en una segunda terminal
```

Sin terminal (CI, scripts), pasá todo como flags:

```bash
npm run create -- --type backoffice --name my-admin --yes
npm run create -- --type backoffice --name my-admin --yes \
  --keycloak-url https://keycloak.mycompany.com --keycloak-realm my-realm
npm run create -- --type backoffice --name my-admin --yes --no-mock-api --dark-mode
```

| Flag                          | Significado                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| `--type public\|backoffice`   | Tipo de app                                                                                 |
| `--name <nombre>`             | Nombre del proyecto: minúsculas, números y guiones simples                                  |
| `--out <dir>`                 | Directorio padre del proyecto nuevo (por defecto: la carpeta que contiene este repositorio) |
| `--keycloak-url <url>`        | Backoffice: URL base de Keycloak (la parte antes de `/realms`)                              |
| `--keycloak-realm <realm>`    | Backoffice: realm                                                                           |
| `--keycloak-client-id <id>`   | Backoffice: client id (por defecto, el nombre del proyecto)                                 |
| `--no-mock-api`               | Backoffice: sin API mock; el ABM usa un archivo JSON y guarda los cambios en memoria        |
| `--dark-mode`                 | Soportar modo oscuro (botón en el header; por defecto: solo claro)                          |
| `--rendering <ssr\|ssg\|spa>` | Sitio público: modo de renderizado (por defecto `ssr`; `spa` no tiene SEO)                  |
| `--remote <url>`              | Conectar un repositorio git existente como `origin` (nunca hace push)                       |
| `--no-commit`                 | Omitir el commit inicial (sin terminal no hay commit por defecto)                           |
| `--install` / `--no-install`  | Ejecutar `npm install` tras generar (por defecto: no)                                       |
| `-y`, `--yes`                 | Sin preguntas, salida en texto plano (requiere `--type` y `--name`)                         |
| `-h`, `--help`                | Mostrar la ayuda                                                                            |

El CLI se niega a escribir en un directorio que no esté vacío.

<a id="develop-the-templates"></a>

## Desarrollar los templates

Instalá las dependencias de un template con husky deshabilitado, para que no modifique la configuración git de este repositorio:

```bash
cd templates/backoffice
HUSKY=0 npm install
npm start
```

Verificá todo (instalación, lint, tests unitarios, build y e2e de cada template, más los tests del CLI):

```bash
npm run verify          # completo
npm run verify:quick    # sin Playwright
```

`node scripts/verify-templates.mjs --template public --only lint,test` ejecuta un subconjunto. Una corrida completa también genera un backoffice con `--no-mock-api --dark-mode` y lo verifica (se omite con `--skip-variant`). El script termina con código distinto de cero si falla algún paso.

Cada template tiene un `README.md` (español, por defecto) y un `README.en.md` (copia en inglés), ambos se generan en cada proyecto nuevo, y un `CLAUDE.md` (comandos, estructura y convenciones para asistentes de IA); mantenelos sincronizados. El nombre `coto-angular-template` es el placeholder que reemplaza el CLI, así que seguí usándolo en los archivos de los templates.

<a id="repository-layout"></a>

## Estructura del repositorio

```
cli/            wizard (Node, ESM) y sus tests
templates/
  public/       template de sitio web público
  backoffice/   template de backoffice
scripts/        verify-templates.mjs
openspec/       specs y propuestas de cambio (este proyecto se construye con OpenSpec)
```
