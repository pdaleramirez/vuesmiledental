<script setup lang="ts">
// No props. Shares useAnalyticsConsent() with the client plugin. Mount once in
// <ClientOnly>; the banner stays hidden when GA is disabled or off the live host.
const { enabled, choice, preferencesOpen, setChoice, openPreferences } = useAnalyticsConsent()
</script>

<template>
  <aside v-if="enabled && (!choice || preferencesOpen)" class="analytics-choice" aria-labelledby="analytics-choice-title">
    <h2 id="analytics-choice-title">A little choice about cookies.</h2>
    <p>May we use Google Analytics cookies to understand visits to this website? Analytics is optional. Your appointment selections are not included.</p>
    <div class="analytics-choice-actions">
      <button type="button" class="analytics-reject" @click="setChoice('denied')">Reject analytics</button>
      <button type="button" class="analytics-accept" @click="setChoice('granted')">Allow analytics</button>
    </div>
  </aside>
  <button v-else-if="enabled" type="button" class="analytics-settings" @click="openPreferences">Cookie settings</button>
</template>

<style scoped>
.analytics-choice { position: fixed; z-index: 80; bottom: 1rem; left: 1rem; width: min(27rem, calc(100vw - 2rem)); padding: 1.4rem; background: #fffdf8; color: #2d4541; border: 1px solid #d9d3bf; border-radius: 1rem; box-shadow: 0 8px 35px #263f3826; }
.analytics-choice h2 { margin: 0 0 .6rem; font-size: 1.2rem; font-weight: 600; }
.analytics-choice p { margin: 0; font-size: .875rem; line-height: 1.65; }
.analytics-choice-actions { display: flex; flex-wrap: wrap; gap: .65rem; margin-top: 1rem; }
.analytics-choice-actions button { flex: 1; padding: .7rem .8rem; border: 1px solid #304f4b; border-radius: .35rem; font-size: .8rem; font-weight: 600; }
.analytics-reject { background: #fffdf8; color: #304f4b; }
.analytics-accept { background: #304f4b; color: white; }
.analytics-settings { position: fixed; z-index: 70; left: .75rem; bottom: .75rem; padding: .45rem .7rem; border: 1px solid #d9d3bf; border-radius: .35rem; background: #fffdf8; color: #304f4b; font-size: .7rem; box-shadow: 0 2px 8px #263f3812; }
button:focus-visible { outline: 3px solid #b29d64; outline-offset: 3px; }
</style>
