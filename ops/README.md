# VueSmile EC2 deployment

Public website: https://13.229.116.230/

Public Craft control panel: https://13.229.116.230/admin

The `dale` SSH profile connects as `pdaleramirez`. The checkout is
`/home/pdaleramirez/vuesmiledental`, using PHP 8.3 FPM, nginx, and a dedicated
local MySQL database named `vuesmiledental`. Production credentials are in the
server's ignored `.env`; development mode and admin schema changes are disabled.
Composer packages come from the committed lockfile. Nuxt is generated locally
and served as static files; no Node server is required on EC2.

## Edit production content

Open https://13.229.116.230/admin and sign in with your existing Craft account.
Edit **Singles → Homepage** or **Services**, save, and reload the public website.
No SSH tunnel is required. HTTP requests redirect to HTTPS.

The IP has a trusted Let's Encrypt certificate, requested with Certbot's
`shortlived` profile and `--ip-address`. Certbot's snap renewal timer is enabled.
The deploy hook `/etc/letsencrypt/renewal-hooks/deploy/vuesmiledental-nginx.sh`
validates and reloads nginx after renewal (source: `reload-nginx-after-renewal.sh`). Renewal was tested using:

```sh
sudo /snap/bin/certbot renew --cert-name 13.229.116.230 --dry-run --run-deploy-hooks --no-random-sleep-on-renew
```

The certificate/key live under `/etc/letsencrypt/live/13.229.116.230` and are never
committed. HTTP-01 validation uses `/var/lib/letsencrypt/.well-known/acme-challenge`.

## Update code

On EC2:

```sh
cd /home/pdaleramirez/vuesmiledental
git pull --ff-only
composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader
php craft up --interactive=0
```

Generate the frontend locally from the same Git revision. Set
`NUXT_PUBLIC_SITE_URL=https://13.229.116.230`; generate against a reachable Craft
API through `NUXT_CRAFT_API_ORIGIN`. In DDEV the API origin is `http://127.0.0.1`.
Transfer `frontend/.output/public/` into the server's `web/`, preserving
`web/index.php`, `web/uploads`, and `web/cpresources`. For tar archives on macOS,
use `COPYFILE_DISABLE=1 tar --no-xattrs ...` to avoid Apple metadata files.
DDEV excludes `.output` from host synchronization: export the container's fresh
output before restarting the dev daemon (Nuxt dev can clear `.output`). Do not
package a stale `frontend/.output` folder from your Mac.

```sh
ddev exec supervisorctl stop webextradaemons:nuxt
ddev exec env NUXT_PUBLIC_SITE_URL=https://13.229.116.230 NUXT_CRAFT_API_ORIGIN=http://127.0.0.1 npm --prefix frontend run generate
task_export_dir=$(mktemp -d)
docker cp ddev-vuesmiledental-web:/var/www/html/frontend/.output/public/. "$task_export_dir/"
ddev exec supervisorctl start webextradaemons:nuxt
```

Package that exported directory, transfer it over SSH, and extract into the
server's `web/`. When transferring existing uploads, ensure public image files
are readable by nginx (directories `755`, files `644`). Keep `.env` at `600`.

The initial deployment copied the local database and uploads. **Do not import
that development database again for routine releases**: production editor
changes live in the server's database. Apply migrations instead.

## Web server and maintenance

`nginx-ip.conf` is installed at
`/etc/nginx/sites-available/vuesmiledental-ip.conf` and linked into sites-enabled.
Validate with `nginx -t` before reloading. It matches this IP only, leaving the
existing domain virtual hosts in place. The HTTPS listener serves Nuxt, the
read-only `/api/homepage` and `/api/services` endpoints, and authenticated Craft
administration. Port 80 redirects to HTTPS except ACME validation requests. `/index.html` is a supported Nuxt homepage alias.

The application owner's crontab runs `run-queue.sh` every minute and
`backup-database.sh` daily at 18:00 UTC (2:00 AM Manila). Both scripts prevent
overlapping runs. Backups are private, gzip compressed, retained for 14 days, and
stored in `storage/backups`. Cron logs are in `storage/logs`. Backups are on this
server's disk; off-server disaster recovery is not configured.

When adding a domain, update DNS, nginx server names, production
`PRIMARY_SITE_URL`, and the frontend build URL; request a certificate for that
domain. No domain is configured yet; the IP already has HTTPS.
