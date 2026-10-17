/**
 * Basic-consent GA4 setup: loads Google only after Analytics is accepted.
 * Inputs: public.gaMeasurementId (G-...) and public.siteUrl (production origin).
 * No exported API/return value; Nuxt runs this client-only plugin automatically.
 * Example generation: NUXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
 * NUXT_PUBLIC_SITE_URL=https://vuesmiledental.com npm run generate
 * Tracks one homepage page_view; /index.html is normalized to /. Hashes, query
 * strings, appointment choices and form fields are never sent. Other routes need
 * an explicit privacy review/allowlist change. Enhanced measurement stays off in
 * GA Admin; do not add automatic form/outbound tracking through another tag.
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const { enabled, choice, restoreChoice } = useAnalyticsConsent()
  const measurementId = String(config.public.gaMeasurementId || '')
  let siteOrigin: string
  try {
    const site = new URL(String(config.public.siteUrl))
    if (import.meta.dev || site.protocol !== 'https:' || site.hostname !== location.hostname
      || !['/', '/index.html'].includes(location.pathname)
      || !/^G-[A-Z0-9]+$/.test(measurementId)) return
    siteOrigin = site.origin
  } catch { return }

  enabled.value = true
  restoreChoice()
  const analyticsWindow = window as Window & {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  } & Record<string, unknown>
  let configured = false
  let lastPage: string | undefined
  const deniedAds = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }

  // The Google tag consumes an Arguments object for each queued command.
  function gtag(..._args: unknown[]) { analyticsWindow.dataLayer!.push(arguments) }

  function sendHomepageView() {
    if (choice.value !== 'granted' || !['/', '/index.html'].includes(location.pathname)) return
    const page = `${siteOrigin}/`
    if (lastPage === page) return
    lastPage = page
    gtag('event', 'page_view', { page_location: page, page_title: 'VueSmile Dental Clinic' })
  }

  // Only delete GA cookies, including domain-scoped cookies, when consent is withdrawn.
  function clearAnalyticsCookies() {
    const names = document.cookie.split(';').map(value => value.trim().split('=')[0])
      .filter(name => /^_ga(?:_|$)/.test(name))
    const labels = location.hostname.split('.')
    const domains = ['', ...labels.slice(0, -1).map((_, i) => `; Domain=.${labels.slice(i).join('.')}`)]
    for (const name of names) for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure${domain}`
    }
  }

  watch(choice, value => {
    analyticsWindow[`ga-disable-${measurementId}`] = value !== 'granted'
    if (value !== 'granted') {
      if (configured) {
        gtag('consent', 'update', { ...deniedAds, analytics_storage: 'denied' })
        clearAnalyticsCookies()
      }
      lastPage = undefined
      return
    }
    if (!configured) {
      analyticsWindow.dataLayer = analyticsWindow.dataLayer || []
      analyticsWindow.gtag = gtag
      gtag('consent', 'default', { ...deniedAds, analytics_storage: 'granted' })
      gtag('js', new Date())
      // Referrer origin supports basic source reporting without sending its query/path.
      let referrer = ''
      try { referrer = new URL(document.referrer).origin } catch { /* No referrer. */ }
      gtag('config', measurementId, {
        send_page_view: false,
        page_location: `${siteOrigin}/`,
        page_title: 'VueSmile Dental Clinic',
        page_referrer: referrer,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_flags: 'SameSite=Lax;Secure',
      })
      gtag('set', 'ads_data_redaction', true)
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
      document.head.appendChild(script)
      configured = true
    } else {
      gtag('consent', 'update', { ...deniedAds, analytics_storage: 'granted' })
    }
    sendHomepageView()
  }, { immediate: true, flush: 'sync' })
})
