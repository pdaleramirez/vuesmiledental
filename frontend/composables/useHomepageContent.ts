import type { HomepageContent } from '~/types/homepage'

/**
 * Read the published Craft Homepage single; no arguments.
 * Returns reactive data/status/error refs and refresh() for retries.
 * Server rendering includes a published snapshot for initial HTML and SEO.
 * Refreshes in the browser on every visit, so saved CMS edits need no rebuild.
 * Static HTML/social previews reflect the last build; rebuild to update that snapshot.
 * NUXT_CRAFT_API_ORIGIN must point to reachable Craft during generation/SSR.
 * @example
 * const { data: content, error, refresh } = await useHomepageContent()
 * // In the template: <h1 v-if="content">{{ content.heroTitle }}</h1>
 */
export function useHomepageContent() {
  const config = useRuntimeConfig()
  const result = useApi<HomepageContent>('/api/homepage', {
    key: 'homepage-content',
    baseURL: import.meta.server ? config.craftApiOrigin : undefined,
  })
  // Wait until hydration finishes; an earlier refresh can reuse Nuxt's build snapshot.
  onNuxtReady(() => { void result.refresh() })
  // Do not keep displaying a cached snapshot if the entry has been unpublished.
  watch(result.error, error => { if (error) result.data.value = null })
  return result
}
