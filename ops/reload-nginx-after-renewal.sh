#!/bin/sh
# Load renewed TLS certificates only after nginx configuration validates.
# Certbot invokes this deploy hook automatically, with no arguments.
# Exit status reports validation/reload success. Requires root/systemctl access.
# Install: sudo install -m 755 ops/reload-nginx-after-renewal.sh \
#   /etc/letsencrypt/renewal-hooks/deploy/vuesmiledental-nginx.sh
set -eu
/usr/sbin/nginx -t
/bin/systemctl reload nginx
