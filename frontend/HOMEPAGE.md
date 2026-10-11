# VueSmile homepage

The homepage is `pages/index.vue`; styles are in `assets/css/homepage.css`.
`components/ClinicLogo.vue` displays the unmodified original logo, with CSS
framing to hide its large white photo margins. `ClinicIcon.vue` supplies
consistent decorative SVG icons.

## Branding and content

- Logo: original VueSmile Dental Clinic Facebook profile photo, reviewed
  3 October 2026. Source: https://www.facebook.com/photo/?fbid=122116999346996979&set=a.122098429034996979
- Logo file: `public/images/vuesmile-logo-original.jpg`. Preserve the original
  gold tooth, Vue lettering, smile curve, and wordmark.
- Palette: ivory `#F8F5EE`, muted gold `#B39A65`, deep teal `#244F49`.
- Hours and location: the public Facebook profile shows Monday–Saturday,
  9 AM–5 PM, and Golden Meadows, Gabi Road, Cordova, Cebu, 6017.
- Services use the previously reviewed public clinic content. Confirm the
  final treatment copy and scope with the clinic before public launch.
- The telephone number and email are omitted because the reviewed contact
  details require reconciliation. No invented dentist credentials, reviews,
  prices, patient photos, or clinic-interior photographs are included.
- The hero is an AI-generated decorative dental still life. It does not
  represent the clinic's facilities or a clinical outcome.

## Appointment behavior

Service cards select the corresponding appointment option. The visit planner
creates a message locally from the selected service and optional preferred
date/time. The patient copies it and sends it using Messenger. The planner
does not submit requests to Craft, reserve appointments, or store patient
information. Clinic confirmation is required. Messenger and Facebook links
open in a new tab; directions use a Google Maps address search, not an
unverified coordinate pin.

## Build

Keep `ssr: true` and the reference Craft template redirect to `index.html`.
Run `ddev npm run generate` to refresh `web/` after editing the homepage.
If generating while the DDEV Nuxt development daemon is running, stop it
first to avoid simultaneous writes to `.nuxt`, and start it afterward:

```sh
ddev exec supervisorctl stop webextradaemons:nuxt
ddev npm run generate
ddev exec supervisorctl start webextradaemons:nuxt
```

## Hero asset generation

Tool: built-in imagegen (no fallback CLI).
Saved image: `public/images/vuesmile-dental-still-life.png`.

Final prompt:

```text
Use case: product-mockup
Asset type: editorial hero image for VueSmile Dental Clinic website, image only, no interface
Primary request: a beautifully composed premium dental still life in warm ivory and muted gold that complements a gold tooth outline logo.
Scene/backdrop: pale warm cream studio, soft morning sunshine, gentle shadow from an out of frame tropical leaf.
Subject: one large beautifully sculpted ivory ceramic tooth model standing on a low round travertine pedestal; beside it a small dental mirror with a brushed champagne gold handle and an off-white toothbrush in a minimal cylindrical holder. A small sage-green leaf sprig at the far edge. Healthy, welcoming and calm.
Style/medium: sophisticated photorealistic product photography, subtle natural material texture, no plastic cartoon sheen
Composition/framing: portrait 4:5 composition, tooth model centered, leave generous air above and at edges, large subject occupying 55% of frame, eye level angled slightly downward. No people.
Lighting/mood: soft natural directional light, warm calm approachable premium editorial aesthetic.
Color palette: cream #F5F0E6, warm white, sand, muted gold #B59A64, subtle sage
Constraints: no text, no logos, no watermark, no anatomy cutaway, no clinical claims, no user interface, no dramatic high contrast, no neon.
```
