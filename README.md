# Nightside

A free aurora, moon, sun and star app. Installs to your phone's home screen and runs like a native app. No account, no server, no paid tier, no tracking.

Built as a PWA rather than a store app because that avoids the $25 Play Console fee, the review queue, and any build toolchain — and it installs on both Android and iPhone from the same URL.

---

## 1. Getting it onto your phone

The app needs a stable HTTPS URL. A local `file://` open will not work: service workers, geolocation and install-to-home-screen all require a secure origin.

### Option A — GitHub Pages (free, 5 minutes)

| Step | Action |
|---|---|
| 1 | Create a repo, e.g. `SandeepSuresh11/nightside`. Public repos get Pages free. |
| 2 | Drop `index.html`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` in the root. |
| 3 | Settings → Pages → Source: **Deploy from a branch** → `main` / `/ (root)` → Save. |
| 4 | Wait ~1 minute, then open `https://sandeepsuresh11.github.io/nightside/` on your phone. |

### Option B — Azure Static Web Apps (free tier)

Same shape as the OEM catalog deployment: point a Static Web App at the repo, app location `/`, no API, no build command. Leave it anonymous — there is nothing here to protect.

### Installing

- **Android / Chrome** — a install prompt appears, or menu → *Add to Home screen*.
- **iPhone / Safari** — Share → *Add to Home Screen*. It must be Safari; Chrome on iOS cannot install PWAs.

Once installed it opens full screen with no browser chrome.

---

## 2. Files

| File | What it is |
|---|---|
| `index.html` | The entire app — markup, styles, and logic in one file. No build step, no dependencies to install. |
| `manifest.json` | Name, icons, colours, standalone display mode. |
| `sw.js` | Service worker. Network-first for the app shell, cached fallback for data. |
| `icon-*.png` | Home screen icons, including a maskable variant for Android's adaptive icons. |

## Modes

| Mode | Interactive view | Data behind it |
|---|---|---|
| Aurora | Live curtain header driven by current Kp, plus a Draw tab | NOAA Kp, OVATION, solar wind, Open-Meteo cloud |
| Moon | Draggable sphere, real phase and terminator, 28 named features at true selenographic coordinates | Computed on-device; libration included |
| Sun | Live NASA SDO photography, five channels, pan and zoom, NOAA active regions circled on top | SDO near-real-time imagery, NOAA Solar Region Summary, F10.7, GOES X-ray |
| Stars | Draggable sky, tap to select and glide onto an object, illustrated portraits, graded Milky Way | 76 catalogue stars with spectral class and distance, JPL Keplerian elements |

Two libraries load from a CDN at runtime: Leaflet 1.9.4 (map) and IBM Plex (fonts). Both are cached by the service worker after first load. If either CDN is unreachable the map degrades to an error and everything else keeps working.

---

## Photographic imagery

### Sun — drawn, always live

The Sun view is a continuous drawn representation rather than a photograph. It has granulation at two scales, limb darkening from the real I(mu) = 1 − u(1 − mu) law, faculae near the limb, prominences, a breathing corona, and the surface turning at the Sun's real equatorial rate.

The sunspots on it are real: every group comes from NOAA's Solar Region Summary at its reported heliographic latitude, longitude and area, foreshortened toward the limb, and drawn as a cluster when the report says the group has many spots.

The earlier build used live NASA SDO photography with five channel chips and a Helioviewer time-lapse button. Both are gone — a still photograph is not "live", and one always-running view beats a channel picker.

### Moon — pick a photo

The Moon is drawn from real feature coordinates by default. To make it photographic, open the Moon tab and use **Choose a lunar map from this phone**. Pick any equirectangular lunar map from your device; it is stored in IndexedDB on that device and never uploaded. Phase, terminator and libration keep working — only the surface changes.

The app also looks for a `moon.jpg` sitting next to `index.html`, if you would rather commit one to the repo.

Requirements: equirectangular (plate carrée), 2:1 aspect, centred on 0° longitude, north up. 2048×1024 is plenty — anything larger is downsampled.

| Source | Notes |
|---|---|
| NASA SVS CGI Moon Kit — `svs.gsfc.nasa.gov/4720` | Authoritative, public domain, from the LROC WAC mosaic. Ships as 16-bit TIFF and EXR, so it needs converting. |
| NASA SVS 14959 | Moon models for web and AR; smaller, more web-ready assets. |
| USGS Astrogeology — `astrogeology.usgs.gov` LROC WAC global mosaic | Downloadable at several reduced resolutions, already equirectangular. |

I could not download and convert one for you: the sandbox I build in only reaches a package-registry allowlist, not NASA or USGS.

## Stars mode

**Tap to select.** Tapping a star or planet glides the view onto it and opens a card: altitude and direction, rise or set time, and for planets the real distance, apparent angular size and illuminated fraction.

**Portraits are illustrations, not photographs**, and the card says so. The Sun portrait has a pulsing corona, granulation, limb darkening, prominences on the limb, and the *real* NOAA sunspot groups placed at their reported heliographic positions. The Moon portrait reuses the same sphere shader as the Moon tab, so it carries the true phase, libration and surface — including your own photographic map if you loaded one. They are built from real numbers though — planet radii, the computed phase angle, Jupiter's belts and Great Red Spot near 22°S, Saturn's rings at their real radii with the Cassini Division between 1.95 and 2.03 Saturn radii, Mars's polar cap and dark albedo regions.

**The phase terminator was wrong on the first pass** and worth describing, because it looked plausible while being badly broken. The terminator is an ellipse whose semi-minor axis is R·|1−2k| for illuminated fraction k, and the canvas sweep flag decides which side of it is dark. I had that flag inverted, which rendered a 92%-lit Mars as almost fully black. It is now verified by rendering the shape and counting lit pixels:

| Target k | Measured lit fraction |
|---|---|
| 0.05 | 0.039 |
| 0.25 | 0.242 |
| 0.50 | 0.500 |
| 0.75 | 0.751 |
| 0.92 | 0.924 |
| 0.99 | 0.994 |

**What is real in the sky view:** star positions, spectral classes and distances; planet positions; the Milky Way band from the galactic equator, graded so the Sagittarius bulge is far brighter than the anticentre; atmospheric extinction using Kasten-Young airmass at roughly 0.2 magnitudes per airmass; scintillation stronger near the horizon; sky brightness from the Sun's depression and from moonlight.

**Ground silhouette bug.** The horizon polyline breaks into pieces whenever part of it falls outside the projection, and closing that broken path down to the bottom corners produced stray black wedges across the sky — visible as a bar straight through the middle of the view. The ground is now filled only from the visible horizon points sorted by x, and only when they actually span the view as a single left-to-right edge.

**What is not:** the ~1500 faint background stars are scenery, added because 76 stars makes any sky look empty. They are not catalogue positions, are never labelled and cannot be tapped. Their density does rise towards the galactic plane, which is true of the real sky. The app states this in the guide.

## Rendering notes

The Moon is drawn per-pixel, which is where most of the tuning went.

**Compositing.** `putImageData` replaces the destination outright rather than blending, so drawing the Sun's disc that way punched a transparent square through the corona behind it — which read as a black box. That is moot for the Sun now that it is real imagery, but the Moon renders into an offscreen canvas and lands with `drawImage` for the same reason.

**Moon shading.** Two levels were wrong at first. Earthshine was set high enough to light the entire unlit hemisphere, and separately a 0.14 ambient floor in the shading term meant the night side was never darker than 14% grey — between them, every crescent rendered as grey mush. Earthshine is now scaled as (1−k)^2.2 so it only appears near new, and the ambient floor is gone. Phase geometry was verified separately: a waxing Moon lights the selenographic-east limb (Mare Crisium first) and a waning Moon lights the west, which is what the renderer does.

**Cost.** The Moon shader evaluates 28 named features per pixel. At full device resolution on a high-DPI phone that is over 200,000 pixels; it now renders into a fixed 328 px buffer (168 px while you drag) and scales up, cutting the work by 2.5× at rest and nearly 10× mid-drag. Features are precomputed into unit vectors with a cosine cull so most of them skip the `acos` entirely.

**Mare outlines.** Positions and sizes are the real published values, but drawing them as perfect circles looked nothing like the Moon. Outlines now carry a low-frequency irregularity, and Mare Frigoris and Oceanus Procellarum get their real elongation — Frigoris is a long narrow band, Procellarum runs north–south.

**Tycho's rays.** The first version computed a bearing without a proper local tangent frame and produced a geometric starburst. It now builds east/north vectors at the crater and traces the streaks along great circles, with uneven widths and real gaps, reaching about 70° from the crater as they do in life.

**Labels.** Both views place labels greedily, largest feature first, and drop any that would overlap one already placed — capped at 9 on the Moon and 6 on the Sun. Labels are suppressed entirely while dragging.

## Draw tab

Sketch a band across the canvas and it becomes a live curtain. Undo, Erase all, a ridge silhouette toggle, and Save image (writes a PNG to your downloads).

It is a toy, but the physics is not made up:

- **Rays hang vertically** regardless of which way you draw the band, because real aurora is field-aligned.
- **Colour is layered by altitude.** Green oxygen at 100–150 km is the body. The red 630 nm crown sits *above* it at 200–400 km, and only appears at Kp 4.5+. The purple-pink nitrogen fringe rides the lower edge and only shows at Kp 5.5+.
- **Brightness follows the live Kp.** Draw on a quiet night and you get thin green arcs; draw during a storm and the same stroke gains a crown.

The animation loop only runs while the tab is open, and honours `prefers-reduced-motion` by rendering a single static frame instead.

## 3. Where the data comes from

Every source is public and free. No API keys anywhere in the code.

| Feed | URL | Used for |
|---|---|---|
| Planetary Kp, 1-minute | `services.swpc.noaa.gov/json/planetary_k_index_1m.json` | The live Kp number |
| Kp 3-day forecast | `services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json` | Forecast chart, hourly scoring |
| OVATION aurora model | `services.swpc.noaa.gov/json/ovation_aurora_latest.json` | Map overlay, probability at your spot (~900 KB, updates every 5 min) |
| Solar wind magnetic field | `services.swpc.noaa.gov/products/solar-wind/mag-1-day.json` | Bz and Bt |
| Solar wind plasma | `services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json` | Speed and density |
| Watches and warnings | `services.swpc.noaa.gov/products/alerts.json` | NOAA alert feed |
| 27-day outlook | `services.swpc.noaa.gov/text/27-day-outlook.txt` | Long-range planning |
| Hourly cloud cover | `api.open-meteo.com/v1/forecast` | Cloud, temperature, wind |
| Place search | `geocoding-api.open-meteo.com/v1/search` | Adding locations by name |
| Solar regions | `services.swpc.noaa.gov/json/solar_regions.json` | Active regions on the Sun view |
| F10.7 radio flux | `services.swpc.noaa.gov/json/f107_cm_flux.json` | Solar activity level |
| GOES X-ray | `services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json` | Current flare class |
| Map tiles | Esri ArcGIS Online, or `tile.openstreetmap.org` | Base map — all keyless |

**Verified against the live endpoints:** the Kp forecast JSON format was checked directly and the parser handles both shapes SWPC uses (array-of-objects and header-row-plus-rows).

**Basemap change, August 2026.** CARTO began requiring an API key for its raster basemaps and watermarks unauthenticated tiles. The app now defaults to Esri's Dark Gray Canvas, with Esri World Imagery and standard OpenStreetMap as alternatives in the Map tab. All three are keyless.

**Not yet verified live:** `27-day-outlook.txt`, `alerts.json`, `solar_regions.json`, `f107_cm_flux.json` and the GOES X-ray path are the documented SWPC product paths but were not fetched during the build. Both are wrapped in try/catch and fail with an honest message in the UI rather than breaking the page. If either 404s on first run, the fix is a one-line URL change in the `SRC` object near the top of the script.

NOAA data is US Government work and in the public domain. Open-Meteo is free for non-commercial use. Map tiles are © OpenStreetMap contributors, © CARTO.

---

## 4. How the score is calculated

Four factors, multiplied. Each returns 0–1.

| Factor | Method |
|---|---|
| Aurora strength | Your geomagnetic latitude versus the auroral oval's equatorward edge, taken as `66.5 − 2.05 × Kp` degrees. Full score inside the oval, tapering to zero 8° equatorward — that band is where aurora still shows low on the horizon, because the emission sits 100–300 km up. Blended with the OVATION grid value where it covers you. |
| Darkness | Sun altitude. 1.0 below −12°, 0 above −6°, linear between. |
| Clear sky | `(100 − cloud %) / 100` from Open-Meteo, hour by hour. Falls back to 0.6 if weather is unavailable. |
| Moonlight | `1 − 0.45 × illuminated fraction`, applied only while the moon is above the horizon. |

Bands: **Go outside** ≥ 0.55 · **Good chance** ≥ 0.32 · **Slim chance** ≥ 0.14 · **Not tonight** below that.

### Known approximation

Geomagnetic latitude uses a centred dipole with the pole at 80.7 °N, 72.7 °W. Spot-checked against published values:

| Place | This model | Published |
|---|---|---|
| Tromsø | 67.5° | ~67° |
| Fairbanks | 65.6° | ~65.8° |
| London | 53.4° | ~54° |
| Seattle | 53.1° | ~53° |
| Reykjavík | 68.9° | ~65° |
| Hobart | −49.7° | ~−51.6° |

Good to about a degree across most of the northern auroral zone. It runs several degrees optimistic over Iceland and Greenland and a couple of degrees pessimistic in the far south, because a centred dipole cannot represent the offset of the real field. Corrected geomagnetic coordinates would fix it, but need a full IGRF implementation and a coefficient table.

### What was checked against known values

| Test | Result | Expected |
|---|---|---|
| Full moon 3 Jan 2026 | 99.8% lit | 100% |
| London solar noon, June solstice | 61.9° | 62.0° |
| London solar noon, December solstice | 15.1° | 15.1° |
| London sunrise, equinox | 06:04 UTC | ~06:05 |
| Sydney day length, June solstice | 9.83 h | ~9.9 |
| Mercury maximum elongation over a year | 27.7° | ≤28° |
| Venus maximum elongation over a year | 46.8° | ≤47.2° |
| Jupiter Earth-distance range | 4.23–6.30 AU | 4.2–6.4 |
| Saturn Earth-distance range | 8.43–10.49 AU | 8.0–11.1 |
| Galactic centre position | 17h 46m, −28.94° | 17h 45.6m, −28.94° |
| Polaris altitude at latitude 64.15° | 64.06° | ≈ latitude |

Planet positions come from the JPL approximate Keplerian elements, good to a few arcminutes between 1800 and 2050. Star positions are J2000 catalogue values with no proper-motion correction, which matters for nothing you would do with a phone.

---

## 5. Alerts, honestly

Notifications work, with a real caveat. Without a push server, checks only run while the app is open or recently backgrounded. Phones suspend background web apps aggressively, iOS especially. So:

- Treat the alerts as a good bet, not a guarantee.
- Keep NOAA's own alert emails or a second app on for genuine storm-level events.
- Installing to the home screen (rather than using it in a browser tab) meaningfully improves how long the app stays alive in the background.

A real push service would need a server, a VAPID key pair, and somewhere to store subscriptions — which means running infrastructure and stops it being free-with-no-strings. That trade seemed like the wrong one here.

Settings: Kp threshold, minimum viewing score, quiet hours, a cooldown between alerts, and check interval. All stored in `localStorage`, all on your device.

---

## 6. Privacy

Nothing is collected. There is no analytics, no account, no backend.

Your saved places and settings live in `localStorage` on the phone. Your coordinates are sent to Open-Meteo when fetching cloud cover — that request is the only one containing anything about you, and Open-Meteo does not require a key or identify the caller. Sun, moon and geomagnetic latitude are computed on-device. Erase everything from Guide → *Erase everything on this device*.

---

## 7. Changing things

Everything is in `index.html`. Useful anchors:

| Want to change | Look for |
|---|---|
| Data endpoints | `const SRC = {` |
| Score weights and bands | `auroraStrength`, `darknessFactor`, `moonFactor`, `scoreLevel` |
| Oval position vs Kp | `kpBoundary` |
| Colours | the `:root` block at the top |
| Map overlay colours | `renderMapData`, the `img.data[i]` lines |
| Camera settings table | `renderCam` |

After any edit, bump `BUILD` in `sw.js`. The cache name is derived from it, so a stale service worker cannot serve the old version.
