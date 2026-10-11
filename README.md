# VueSmile Dental Clinic

Craft CMS + Nuxt starter matching the structure and dependency baselines of
`/Users/preciousdaleramirez/devs/funandlovetour`.

```text
vuesmiledental/
├── .ddev/             DDEV configuration, startup scripts, and commands
├── .env               Local Craft environment (ignored)
├── bootstrap.php      Shared Craft bootstrap
├── composer.json      Reference Composer dependencies
├── composer.lock      Reference resolved PHP packages
├── craft              Craft console entry point
├── config/            Clean Craft configuration and generated project config
├── frontend/          Existing Nuxt SPA, npm dependencies, and components
├── local/             Reserved for local Composer packages
├── modules/           Reserved for VueSmile modules
├── storage/           Craft runtime storage
├── templates/         Craft Twig templates
├── vendor/            Installed Composer packages
└── web/               Craft document root and generated Nuxt static output
```

## Start locally

Start Docker Desktop, then run from this project root:

```sh
ddev start
```

DDEV uses PHP 8.2, MySQL 8.0, nginx-fpm, Composer 2, and Node.js 22. On startup
it creates a local Craft `.env` with a fresh security key and installs the locked
Composer dependencies. It also starts the Nuxt dev server, installing locked npm
dependencies into a Linux-only Docker volume on its first run. Later starts
reuse that installation unless the lockfile or Node version changes. Generated
frontend dependency, Nuxt, and output directories are excluded from Mutagen sync.

- Craft/installer: https://vuesmiledental.ddev.site/admin/install
- Craft control panel after installation: https://vuesmiledental.ddev.site/admin
- Nuxt development: https://vuesmiledental.ddev.site:3000
- Nuxt development over HTTP: http://vuesmiledental.ddev.site:2999

Complete the Craft browser installer to choose your administrator credentials,
site name, and language. No admin account or reference database is copied. Use
`https://vuesmiledental.ddev.site` as the primary site URL.

## Commands

```sh
ddev composer validate --no-check-publish
ddev composer install
ddev craft install/check
ddev npm run build
ddev npm run generate
ddev stop
```

`ddev npm` operates inside `frontend/`. `ddev craft` operates at the root.
To restart the Nuxt daemon after configuration changes:

```sh
ddev exec supervisorctl restart webextradaemons:nuxt
```

The normal macOS workflow remains available: run `npm ci` and `npm run dev`
inside `frontend/`. Linux and macOS dependencies are kept separate.

## Static frontend output

Like the reference project, `ddev npm run generate` copies `.output/public`
from `frontend/` into root `web/`. Craft's `web/index.php` and `cpresources/`
are retained. Like the reference, Craft's `templates/index.twig` sends a
301 redirect from `/` to `index.html`. Nuxt uses `ssr: true` to prerender the
homepage and its route payload; the browser hydrates it into the interactive
app. Generate the frontend before opening the main site. The Nuxt dev server
does not require Craft to be installed first.

For environment-specific frontend builds, create `frontend/.env.production`
or `frontend/.env.staging` from `frontend/.env.example`, then run
`ddev npm run generate:prod` or `ddev npm run generate:staging`.
Root `.env.example.dev`, `.env.example.staging`, and `.env.example.production`
describe the separate Craft environment. Production credentials must be supplied
for the target environment; local DDEV credentials are only for development.

## Baseline and scope

Composer requirements and lockfile match the reference: Craft CMS 5.7.2 and
the same CKEditor, Commerce, PayPal Checkout, PayMongo, Instant Analytics GA4,
Formie, Social Login, dotenv, generator, and Yii shell packages. Installing
packages does not activate site plugins or supply their licenses.

The existing npm dependency versions are preserved. Nuxt uses `ssr: true`,
matching the reference, and generates static HTML for the interactive app.

No reference secrets, Craft license, database, tour content, site fields,
payment configuration, analytics tracking IDs, or site assets are copied.
Craft configuration retains normal CSRF protection. New project config is
created by Craft when the site is installed.

The homepage includes branded service discovery, first-visit guidance, FAQs,
location information, and a Messenger appointment-message planner. The planner
prepares and copies a message locally; the patient sends it through Messenger
and the clinic confirms the visit. It does not submit an appointment to Craft.

The original Facebook logo is retained in `frontend/public/images/`. The hero
is an AI-generated dental still life, not a photo of the clinic. Content and
asset provenance are recorded in `frontend/HOMEPAGE.md`.

Configuration references:
- https://craftcms.com/docs/5.x/install.html
- https://craftcms.com/docs/5.x/reference/config/db.html
- https://docs.ddev.com/en/stable/users/extend/customization-extendibility/
