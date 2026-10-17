# VueSmile EC2 deployment

Public website: https://vuesmiledental.com/

Public Craft control panel: https://vuesmiledental.com/admin

The `dale` SSH profile connects as `pdaleramirez`. The checkout is
`/home/pdaleramirez/vuesmiledental`, using PHP 8.3 FPM, nginx, and a dedicated
local MySQL database named `vuesmiledental`. Production credentials are in the
server's ignored `.env`; development mode and admin schema changes are disabled.
Composer packages come from the committed lockfile. Nuxt is generated locally
and served as static files; no Node server is required on EC2.

## Edit production content

Open https://vuesmiledental.com/admin and sign in with your existing Craft account.
Edit **Singles → Homepage** or **Services**, save, and reload the public website.
No SSH tunnel is required. HTTP requests redirect to HTTPS.

The apex and `www` hostnames have a trusted Let's Encrypt certificate. Cloudflare
proxies both DNS records to `13.229.116.230` and uses **Full (strict)** encryption.
Nginx redirects HTTP, `www`, and the legacy IP URLs to the HTTPS apex.
Certbot's snap renewal timer is enabled.
The deploy hook `/etc/letsencrypt/renewal-hooks/deploy/vuesmiledental-nginx.sh`
validates and reloads nginx after renewal (source: `reload-nginx-after-renewal.sh`). Renewal was tested using:

```sh
sudo /snap/bin/certbot renew --cert-name vuesmiledental.com --dry-run --run-deploy-hooks --no-random-sleep-on-renew
```

The certificate/key live under `/etc/letsencrypt/live/vuesmiledental.com` and are never
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
`NUXT_PUBLIC_SITE_URL=https://vuesmiledental.com`; generate against a reachable Craft
API through `NUXT_CRAFT_API_ORIGIN`. In DDEV the API origin is `http://127.0.0.1`.
Transfer `frontend/.output/public/` into the server's `web/`, preserving
`web/index.php`, `web/uploads`, and `web/cpresources`. For tar archives on macOS,
use `COPYFILE_DISABLE=1 tar --no-xattrs ...` to avoid Apple metadata files.
DDEV excludes `.output` from host synchronization: export the container's fresh
output before restarting the dev daemon (Nuxt dev can clear `.output`). Do not
package a stale `frontend/.output` folder from your Mac.

```sh
ddev exec supervisorctl stop webextradaemons:nuxt
ddev exec env NUXT_PUBLIC_SITE_URL=https://vuesmiledental.com NUXT_CRAFT_API_ORIGIN=http://127.0.0.1 npm --prefix frontend run generate
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

`nginx-domain.conf` is installed as
`/etc/nginx/sites-available/vuesmiledental.com.conf`. `nginx-ip.conf` supplies
legacy IP redirects. Both are linked from `/etc/nginx/sites-enabled/`.
Validate with `sudo nginx -t` before `sudo systemctl reload nginx`. Existing
sites on this shared server keep their own virtual hosts.

The domain serves generated Nuxt files, `/api/homepage`, `/api/services`, and
Craft administration through `web/index.php`. `/index.html` remains a supported
Nuxt homepage alias. `PRIMARY_SITE_URL` in the private production `.env` is
`https://vuesmiledental.com`.

### Traffic protection

Cloudflare's automatic network, TLS and HTTP DDoS mitigation is active. The
Cloudflare login rule allows 20 requests per 10 seconds per IP to `/admin/login`,
`/admin/actions/users/login`, or `/actions/users/login`, then blocks matching
requests for 10 seconds. It does not cover patient-facing pages or content APIs.

Nginx uses `nginx/vuesmile-limits.conf` in `/etc/nginx/conf.d/30-vuesmile-limits.conf`
and `nginx/vuesmile-php-protection.conf` in `/etc/nginx/snippets/`. Dynamic requests
are limited to 5/second with burst 20 per visitor; Craft login POSTs are limited
to 5/minute with burst 5. Excess requests/connections receive 429. Static Nuxt
files are unrestricted. Client headers are trusted only from Cloudflare networks.

The apex HTTPS virtual host checks the original TCP peer and rejects direct
origin traffic with 403. Loopback is allowed for server health checks. ACME HTTP
validation remains available for renewals. These protections apply to this site;
they do not isolate the shared server's IP from all possible network attacks.

`update-cloudflare-networks.py` fetches and validates Cloudflare's public CIDRs,
then writes the real-IP snippet and origin-peer geo map. Refresh after Cloudflare
announces address changes, and review/test before reloading:

```sh
sudo python3 ops/update-cloudflare-networks.py
sudo nginx -t
sudo systemctl reload nginx
```

On a fresh server, install the limit files, run the network updater, and use
`nginx-domain-bootstrap.conf` for initial HTTP-01 certificate issuance. Once the
domain certificate exists, install `nginx-domain.conf`. The IP redirect config
also requires the existing IP certificate. Certificate keys and production
credentials must stay outside Git.

The application owner's crontab runs `run-queue.sh` every minute and
`backup-database.sh` daily at 18:00 UTC (2:00 AM Manila). Both scripts prevent
overlapping runs. Backups are private, gzip compressed, retained for 14 days, and
stored in `storage/backups`. Cron logs are in `storage/logs`. Backups are on this
server's disk; off-server disaster recovery is not configured.
