/**
 * Shared HTTP client, automatically registered by Nuxt as useNuxtApp().$api.
 * Use it inside form handlers or Pinia actions; obtain the client before awaiting.
 * Responses are parsed automatically, so there is no Axios-style response.data.
 * Failed requests throw: catch them in the caller to show an appropriate error.
 *
 * Calling signature: $api(url, options?)
 * - url: Endpoint path, e.g. '/api/services', relative to the configured baseURL.
 * - options: Optional request settings. Common fields are:
 *   - method: HTTP method; defaults to GET.
 *   - query: URL parameters, e.g. { category: 'general' } adds ?category=general.
 *   - body: Data sent with POST/PATCH/etc.; plain objects are serialized as JSON.
 *   - headers: Extra HTTP headers for this request.
 *   - timeout: Maximum request duration in milliseconds; overrides 15000 below.
 *   - signal: AbortController signal to cancel the request when needed.
 * Returns a Promise resolving to the parsed response body, or rejecting on error.
 * For example, const result = await $api('/api/services') assigns the body to result.
 *
 * @example GET with query parameters
 * const { $api } = useNuxtApp()
 * const services = await $api('/api/services', {
 *   query: { category: 'general' },
 * })
 *
 * @example POST inside an async submit handler or store action
 * const { $api } = useNuxtApp()
 * try {
 *   await $api('/api/appointments', {
 *     method: 'POST',
 *     body: { service: 'Dental Cleaning', preferredDate: '2026-10-12' },
 *   })
 * } catch (error) {
 *   // Display an error message or rethrow for the calling component to handle.
 * }
 *
 * These endpoints are examples; Craft must implement them and any required
 * authentication/CSRF validation. NUXT_PUBLIC_API_BASE overrides the backend
 * origin; empty uses the website's origin. Never put secrets in public config.
 * For page data with reactive loading/error state, use useApi() instead.
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Create a function with shared settings; this does not send a request yet.
  const api = $fetch.create({
    // Backend origin. Empty keeps paths on the current website's origin.
    baseURL: config.public.apiBase,
    // Abort requests taking longer than 15 seconds (value is milliseconds).
    timeout: 15000,
    // Do not automatically repeat failed requests.
    retry: 0,
    headers: {
      // Ask the backend to return JSON; this does not set the request body format.
      Accept: 'application/json',
    },
  })

  return {
    // Nuxt exposes the "api" key as "$api" on useNuxtApp().
    provide: { api },
  }
})
