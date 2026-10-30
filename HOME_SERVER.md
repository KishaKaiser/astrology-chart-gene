# Shared home library

This version has one library for everyone who can reach the app. It does not
require accounts. Images, WooCommerce, and PL-CMS tabs are removed. The existing
Chatterbox/Ollama connection still generates interpretations.

## Deploy with LinkHosting

Merge the frontend changes, then pull the latest code and rebuild/restart the
**site-astrology** container. Its existing startup command can stay:

```
cd /var/www/html && npm ci && npm run build && npm run preview
```

`npm run preview` now starts the app's Node server, including shared storage,
instead of Vite's static preview. The default port remains **4173**. If a `PORT`
environment variable is set, it must match the proxy's target port. Do not run
`npx vite preview` directly: it does not provide the library API.

The default data file is `/var/www/html/storage/library.json`. With LinkHosting's
site directory bind mount this survives container restarts/rebuilds. Confirm the
mount on **site-astrology**, not the separate API container:

```
sudo docker inspect site-astrology --format '{{range .Mounts}}{{println .Source " -> " .Destination}}{{end}}'
```

Keep that host directory and its `storage` subfolder through redeployments. If
the hosting panel replaces the entire site folder, mount a separate persistent
directory and set `ASTROLOGY_DATA_DIR` to its path inside the container. Back up
`library.json` regularly; copy it while the app is stopped for a consistent file.
Run only one Node server process against a given data directory.

Optional environment variables:

```
PORT=4173
ASTROLOGY_DATA_DIR=/var/www/html/storage
ASTROLOGY_ALLOWED_HOSTS=astrology.link,www.astrology.link
```

Private IPv4 addresses and localhost are accepted automatically. Add any other
local DNS names to `ASTROLOGY_ALLOWED_HOSTS`. The reverse proxy must preserve the
browser's Host header and allow JSON saves up to 32 MB. If large imports fail
with HTTP 413, increase its request-body limit or import smaller collections.

**Keep this no-login app on the trusted home network.** Anyone who can reach it
can read, edit, export, and delete the shared library. Host/Origin checks prevent
unrelated browser sites from using the API; they are not user authentication or
a replacement for firewall/private-network access. Do not forward its port or
publish it through a public tunnel.

## Bring over existing charts

1. Open the updated app using the **same URL and browser profile** where the old
   charts were created. Browser storage is specific to that address/profile.
2. Click **Download backup**, then **Import charts and readings from this browser**.
3. Wait for **Saved on your home server** before closing the tab.
4. Repeat on each computer/browser containing old charts. Duplicate IDs already
   on the server are skipped; their original browser copies are kept untouched.
5. Open the same app from another computer. The charts and saved readings will
   appear without signing in.

Import includes charts, family/compatibility/karmic/past-life reports, personal
horoscopes, important days, blog posts, life events, and election analyses.
Integration credentials and device preferences remain local. Old account-only
records that were never cached in a browser are not automatically migrated.

Changes refresh every 15 seconds, on window focus, or with **Refresh / retry**.
Failed saves are shown in the library status and retained in the current tab's
session storage across reloads. Keep the tab open while saves are pending. A
conflict on the same entry stops the save rather than overwriting other work;
download a backup before choosing **Discard pending changes** and retrying the
edit against the latest shared version. Downloaded backups contain shared data,
pending edits, and old browser data for manual recovery; they are not an
automatic server restore format.

## Development and checks

Run `npm run dev:library` for the library server, and `npm run dev` in another
terminal. Vite proxies `/api/library` to localhost:4173. Then run:

```
node scripts/test-shared-library.mjs
node scripts/test-shared-library-client.mjs
npm run build
```
