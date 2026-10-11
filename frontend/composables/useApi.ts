import type { UseFetchOptions } from 'nuxt/app'

/**
 * Load page data through the shared $api client using Nuxt's useFetch.
 * Call in <script setup>, a Nuxt plugin, or route middleware; Nuxt auto-imports it.
 * Accepts the same options as useFetch, including query, server, and transform.
 * Returns reactive refs: data, status, error, plus refresh() to request data again.
 * Use $api directly in event handlers and Pinia actions.
 *
 * @template T Expected response data type, e.g. Service[] in useApi<Service[]>.
 * This helps TypeScript check usage; it does not validate the backend response.
 * @param url Endpoint path, e.g. '/api/services', relative to the client's baseURL.
 * Can also be a function returning a path, e.g. () => `/api/services/${id.value}`,
 * so useFetch can watch changes to the URL and fetch the updated endpoint.
 * @param options Optional useFetch settings; omit for Nuxt's default behavior.
 * Common options:
 * - query: URL parameters, e.g. { category: 'general' } becomes ?category=general.
 * - method: HTTP method; GET by default. For mutations in handlers, use $api.
 * - body: Request body for methods such as POST; objects are serialized as JSON.
 * - headers: Additional request headers, e.g. { 'X-Custom-Header': 'value' }.
 * - server: true (default) allows server fetching; false fetches in the browser.
 * - immediate: true (default) starts automatically; false waits for execute().
 * - watch: false disables automatic fetching when reactive inputs change.
 * - transform: Function that converts the response before it reaches data.value.
 * The wrapper always uses the shared $api client, even if options includes $fetch.
 * @returns Nuxt's awaitable AsyncData result. Await it in setup to obtain data,
 * status ('idle', 'pending', 'success', 'error'), error, refresh(), and execute().
 * With server: false, awaiting during setup does not wait for browser hydration;
 * data can still be null until the browser request completes.
 *
 * @example Load live data in page setup (endpoint must exist in Craft)
 * const { data, status, error, refresh } = await useApi('/api/services', {
 *   server: false,
 *   query: { category: 'general' },
 * })
 * // In script: data.value holds the response; status.value can be 'pending'.
 * // In the template: refs are unwrapped automatically; use data, status, error.
 * // await refresh() requests the data again using the same options.
 *
 * @example Type the expected response in a TypeScript page
 * type Service = { id: number; name: string }
 * const { data } = await useApi<Service[]>('/api/services', { server: false })
 *
 * On this generated website, server: false loads data after browser hydration,
 * so data may initially be null. Server fetching during generation instead saves
 * a build-time snapshot and requires an absolute, reachable NUXT_PUBLIC_API_BASE.
 */
export function useApi<T>(
  url: string | (() => string),
  options?: UseFetchOptions<T>,
) {
  const { $api } = useNuxtApp()

  // Return directly; the caller may await useApi(), not this wrapper internally.
  return useFetch(url, {
    ...options,
    // Tell useFetch to send requests with our client. The "as" is type-only.
    $fetch: $api as typeof $fetch,
  })
}
