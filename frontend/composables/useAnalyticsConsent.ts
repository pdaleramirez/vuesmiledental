export type AnalyticsChoice = 'granted' | 'denied'
const storageKey = 'vuesmile.analytics-consent.v1'

/**
 * Share the optional Analytics choice between the banner and client plugin.
 * No arguments. Returns reactive enabled/choice/preferencesOpen refs and actions.
 * setChoice(value) accepts 'granted' or 'denied'; returns void and remembers the
 * choice for 180 days on this browser. Storage failures keep an in-memory choice.
 * restoreChoice() is called once by the plugin; openPreferences() reopens the UI.
 * Client actions only; no patient details are stored. A choice is not a user ID.
 * @example
 * const { enabled, choice, setChoice, openPreferences } = useAnalyticsConsent()
 * // <button @click="setChoice('denied')">Reject analytics</button>
 */
export function useAnalyticsConsent() {
  const enabled = useState('analytics-enabled', () => false)
  const choice = useState<AnalyticsChoice | null>('analytics-choice', () => null)
  const preferencesOpen = useState('analytics-preferences-open', () => false)

  function setChoice(value: AnalyticsChoice) {
    if (!import.meta.client) return
    choice.value = value
    preferencesOpen.value = false
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        choice: value,
        expires: Date.now() + 180 * 24 * 60 * 60 * 1000,
      }))
    } catch { /* A storage restriction does not prevent making a choice. */ }
  }

  function restoreChoice() {
    if (!import.meta.client) return
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null')
      if (saved?.expires > Date.now() && ['granted', 'denied'].includes(saved.choice)) {
        choice.value = saved.choice
      }
    } catch { /* Invalid/missing storage leaves Analytics off until a choice. */ }
  }

  function openPreferences() { preferencesOpen.value = true }
  return { enabled, choice, preferencesOpen, setChoice, restoreChoice, openPreferences }
}
