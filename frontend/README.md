# VueSmile Dental Clinic

Nuxt 3 single-page app starter. This setup follows the library dependencies and
reusable Nuxt configuration in `funandlovetour/frontend`; it does not copy the
tour website's assets, content, credentials, analytics, or backend integration.

## Setup

Node.js 22 and npm are used for local validation.

```sh
npm ci
cp .env.example .env
npm run dev
```

Open http://localhost:3000. Run npm commands from `frontend/`. The repository root contains Craft CMS.
Use `ddev npm` from the root to run npm inside the frontend container.

## Commands

- `npm run dev`: local development.
- `npm run build`: production Nitro build.
- `npm run preview`: preview the production build.
- `npm run generate`: static SPA output in `.output/public`.
- `npm run generate:prod`: generate with your own `.env.production` file.
- `npm run generate:staging`: generate with your own `.env.staging` file.
- `npm run clean`: remove generated Nuxt, Nitro, and cache files.
- `npm run build:clean`: clean generated files, then build.

For environment-specific generation, create the corresponding env file from
`.env.example`. No private reference-project environment files were copied.

## Dependency baseline

`package.json` retains the reference project's dependency ranges and dependency
groups. `package-lock.json` retains its resolved packages, with the project name
changed to `vuesmiledental`. Use `npm ci` to reproduce this baseline.

The reference lock resolves Nuxt 3.15.4, Vue 3.5.13, Nuxt UI 2.21.0, Nuxt Content
2.13.4, Nuxt Image 1.10.0, and Tailwind CSS 3.4.17.

Configured modules: Pinia, Nuxt Content, Nuxt UI, Nuxt Easy Lightbox, Nuxt Image.
Heroicons, Vue Datepicker, Axios, ohmyfetch, Vue Awesome Paginate, Vue Cookies,
and the remaining reference libraries are available at their existing versions.
The generic pagination plugin is retained. Import other libraries when needed.

## Nuxt configuration

- Prerenders the homepage with `ssr: true`, then hydrates the interactive app.
- Retains compatibility date `2025-03-04`, development tools, image quality 80,
  Tailwind/Autoprefixer, Vite build settings, and Nitro compression/minification.
- One homepage at `pages/index.vue` replaces tour-derived prerender routes.
- Uses Nuxt's standard dev host/port and proxies `/api/*` to this project's Craft
  backend for browser requests during development, preserving Nuxt Content's
  internal `/api/_content` routes. DDEV uses nginx inside the web container; running
  `npm run dev` on the host uses `http://vuesmiledental.ddev.site`.
- Uses an explicit stylesheet and a clean Tailwind config. No tour assets or
  config-time browser scripts are imported.
- No Google Analytics or chat widget. Craft lives at the root; generation
  now copies the static Nuxt output to `../web` while preserving `index.php`.
- `NUXT_PUBLIC_SITE_URL` overrides the optional public site URL at runtime.

The homepage is intentionally a minimal starter. The approved homepage design,
real clinic photography, and appointment integration can be implemented later.

## API calls

`plugins/api.ts` provides `$api`, a shared `$fetch` client with a 15-second timeout,
JSON response preference, and automatic retries disabled. Failed requests reject;
handle them in the form or store action rather than silently swallowing errors.
`composables/useApi.ts` connects that client to Nuxt's `useFetch`, providing
reactive `data`, `status`, `error`, and `refresh` for page data.

In a page's `<script setup>`, load live data after hydration:

```ts
const { data, status, error, refresh } = await useApi('/api/services', {
  server: false,
})
```

For a form submission or Pinia action, obtain the client before awaiting:

```ts
const { $api } = useNuxtApp()

// GET /api/services?category=general
const services = await $api('/api/services', {
  query: { category: 'general' },
})

// Call inside a submit handler or store action, with try/catch for failures.
await $api('/api/appointments', {
  method: 'POST',
  body: { service: 'Dental Cleaning', preferredDate: '2026-10-12' },
})
```

`GET /api/services` is implemented in Craft and returns published service cards.
`POST /api/appointments` remains an example and is not implemented.
The helpers do not create database access or change the appointment form.
Call `useApi` in setup, a Nuxt plugin, or route middleware. Use `$api` for event
handlers and store actions. No imports are needed in Nuxt components.

`NUXT_PUBLIC_API_BASE` defaults to empty, so paths such as `/api/services` stay
on the website's origin. The development proxy is only active in `nuxt dev`;
the generated site sends requests directly to Craft. For an external backend,
set this variable to its origin and configure that backend's CORS policy.
Public runtime configuration is browser-visible and must not contain secrets.

Use `server: false` for live or user-specific data on this generated website.
Fetching during generation produces a build-time snapshot. For server-side
fetching in development or during generation, configure an absolute, reachable
`NUXT_PUBLIC_API_BASE`; the Vite proxy handles browser requests only. Regenerate the site after changing
public configuration. Craft authentication/CSRF requirements still apply;
the custom client does not automatically forward browser cookies during SSR.

## Manage homepage services in Craft

Open `https://vuesmiledental.ddev.site/admin/entries/services` and sign in.
The six existing homepage services are seeded as entries in **Services**.
Edit the service name, care category, description, card icon, and appointment
link text. Save a published entry to update its card and the appointment dropdown
on the next website load. Disabled entries, drafts, and future-dated entries are
excluded from the public API. Use the structure view to drag entries into the
desired homepage order; all services are kept at one level.

`useDentalServices()` loads `/api/services` after browser hydration, so routine
content changes do not require `npm run generate`. The section heading and
introductory paragraph are managed in the Homepage entry.

The section, entry type, and fields are stored in `config/project`. The content
migration creates missing setup and seeds the original cards without overwriting
existing entries. For another environment, deploy the project configuration and
run the content migration with `php craft migrate/up --interactive=0`.
Database entries themselves are stored in Craft's database, not in Nuxt files.

## Edit all homepage content in Craft

Open [Entries → Singles → Homepage](https://vuesmiledental.ddev.site/admin/entries/homepage/23-homepage).
The entry has tabs for brand/navigation, SEO, hero, service introduction, approach,
first visit, FAQs, appointment labels/message, location/map, and footer.
Existing content is seeded; the six service cards still live under **Services**.

- Edit text directly. Title and emphasis fields control the normal and italic parts of headings.
- Add/remove/reorder table rows for navigation, care highlights, approach points, visit steps, FAQs, and time options.
- Select or upload images through the logo and hero image fields. For a new tightly cropped logo, disable **Crop original logo photo**.
- Edit the Facebook/Messenger URLs and Google Maps search query in their tabs.
- The appointment message supports `{service}`, `{date}`, and `{time}` placeholders.
- Save the published entry and reload the website to see changes. Drafts remain private.
- Page anchors, layout, styling, automatic step numbers/current year, and date-picker behavior remain in Nuxt.

`GET /api/homepage` returns only the published single, with no browser caching.
Generation includes a published snapshot in the HTML for first load and SEO.
After hydration, the browser refreshes from Craft; normal content edits do not need a build.
Rebuild to update static HTML and metadata used by crawlers/social previews.
If the Homepage entry is disabled, the API returns 404 and the browser clears its snapshot.
The small initial loading/network-error screen is application UI rather than CMS content.

For another environment, apply project config/content migrations and transfer the
Craft database plus `web/uploads/homepage` files. The migration is
`migrations/m261012_000001_create_homepage.php`; it preserves existing editor content.
Set the server-only `NUXT_CRAFT_API_ORIGIN` to the reachable Craft origin when generating
outside DDEV. Uploaded images are served by Craft alongside the generated Nuxt files.

## Google Analytics

The **VueSmile Dental Clinic** GA4 property lives under the **Dale** Analytics
account. Its **VueSmile Website** stream uses `G-ZR7JNZWXR4`, Philippine time,
and PHP currency. Enhanced measurement is disabled to avoid automatic form,
search, and outbound-link event collection.

Set these public build variables when generating the live website:

```sh
NUXT_PUBLIC_SITE_URL=https://vuesmiledental.com \
NUXT_PUBLIC_GA_MEASUREMENT_ID=G-ZR7JNZWXR4 \
NUXT_CRAFT_API_ORIGIN=https://your-reachable-craft-origin.example \
npm run generate
```

The measurement ID is public. Empty disables Analytics. Since this is a generated
site, changing EC2 environment variables alone does not update the browser tag;
regenerate and deploy the static output. No additional npm Analytics package is
required. See `plugins/analytics.client.ts` and `useAnalyticsConsent.ts` for usage.

Google loads only after the visitor chooses **Allow analytics**. A browser choice
is remembered for 180 days; **Cookie settings** reopens it. Rejection keeps Google
unloaded; withdrawal disables collection and clears GA cookies. Ads storage, ad
personalization, and Google signals are disabled. The plugin runs only on the
configured live hostname and the homepage (`/` or `/index.html`), outside dev mode.

One explicit homepage view is sent per page load after acceptance. Anchor changes
are not new pages. URL queries/hashes and referrer paths/queries are excluded.
Appointment dates, service selections, and message content are never event
parameters. Keep enhanced measurement off; review any future tracking additions
before sending data. No Craft admin tag is installed.

Run `node --test tests/analytics.test.mjs` for consent/privacy behavior checks.
To verify live collection, accept Analytics on the public site and check the
property's Realtime report. Normal reports may appear later. An ad blocker or a
rejected choice can prevent that browser from appearing in Analytics.
