# VueSmile EC2 deployment

Public website: http://13.229.116.230/

The `dale` SSH profile connects as `pdaleramirez`. The checkout is
`/home/pdaleramirez/vuesmiledental`, using PHP 8.3 FPM, nginx, and a dedicated
local MySQL database named `vuesmiledental`. Production credentials are in the
server's ignored `.env`; development mode and admin schema changes are disabled.
Composer packages come from the committed lockfile. Nuxt is generated locally
and served as static files; no Node server is required on EC2.

## Edit production content before HTTPS is available

Public administration is blocked on HTTP. Run this on your Mac and keep it open:

```sh
ssh -N -L 127.0.0.1:18080:127.0.0.1:8080 dale
```

Open http://localhost:18080/admin and sign in with your existing Craft account.
Traffic to the server travels through encrypted SSH. The private nginx listener
binds only to `127.0.0.1:8080`. Edit **Singles → Homepage** or **Services**, save,
then reload the public website. Stop the tunnel with Ctrl+C.

## Update code

On EC2:

```sh
cd /home/pdaleramirez/vuesmiledental
git pull --ff-only
composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader
php craft up --interactive=0
```

Generate the frontend locally from the same Git revision. Set
`NUXT_PUBLIC_SITE_URL=http://13.229.116.230`; generate against a reachable Craft
API through `NUXT_CRAFT_API_ORIGIN`. In DDEV the API origin is `http://127.0.0.1`.
Transfer `frontend/.output/public/` into the server's `web/`, preserving
`web/index.php`, `web/uploads`, and `web/cpresources`. For tar archives on macOS,
use `COPYFILE_DISABLE=1 tar --no-xattrs ...` to avoid Apple metadata files.

The initial deployment copied the local database and uploads. **Do not import
that development database again for routine releases**: production editor
changes live in the server's database. Apply migrations instead.

## Web server and maintenance

`nginx-ip.conf` is installed at
`/etc/nginx/sites-available/vuesmiledental-ip.conf` and linked into sites-enabled.
Validate with `nginx -t` before reloading. It matches this IP only, leaving the
existing domain virtual hosts in place. The public listener serves Nuxt and the
two read-only `/api/homepage` and `/api/services` endpoints; the private listener
serves Craft administration. `/index.html` is a supported Nuxt homepage alias.

The application owner's crontab runs `run-queue.sh` every minute and
`backup-database.sh` daily at 18:00 UTC (2:00 AM Manila). Both scripts prevent
overlapping runs. Backups are private, gzip compressed, retained for 14 days, and
stored in `storage/backups`. Cron logs are in `storage/logs`. Backups are on this
server's disk; off-server disaster recovery is not configured.

When adding a domain, update DNS, nginx server names, production
`PRIMARY_SITE_URL`, and the frontend build URL; configure HTTPS before exposing
Craft administration publicly. No certificate or domain is configured yet.
