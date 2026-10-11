#!/usr/bin/env bash
set -euo pipefail

# DDEV runs this automatically before Supervisor starts. Stop the whole Nuxt
# process group (including Nitro and Vite workers) when restarting the dev server.
# It changes only the generated Nuxt supervisor section; no parameters are needed.
python3 - <<'PY'
from configparser import ConfigParser
from pathlib import Path

for config_path in Path('/etc/supervisor/conf.d').glob('*.conf'):
    config = ConfigParser(interpolation=None)
    config.read(config_path)
    if config.has_section('program:nuxt'):
        config.set('program:nuxt', 'stopasgroup', 'true')
        config.set('program:nuxt', 'killasgroup', 'true')
        with config_path.open('w') as config_file:
            config.write(config_file)
PY
