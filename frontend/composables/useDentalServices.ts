import type { DentalService } from '~/types/services'

/**
 * Load published Craft services for homepage cards and appointment choices.
 * No parameters are required. Call in page setup; Nuxt auto-imports this function.
 * Returns useApi's reactive data/status/error refs and refresh() for retrying.
 * data is initially null; use computed(() => data.value ?? []) for rendering.
 * Fetches after hydration so edits in Craft appear without regenerating the site.
 *
 * @example
 * const { data, status, error, refresh } = await useDentalServices()
 * const services = computed(() => data.value ?? [])
 * // Display a loading state while status is 'idle' or 'pending'.
 * // Display an error with a retry button that calls refresh() if error is set.
 */
export function useDentalServices() {
  return useApi<DentalService[]>('/api/services', { server: false })
}
