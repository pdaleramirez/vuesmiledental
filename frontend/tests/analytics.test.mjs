import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { ref, watch } from 'vue'

// Execute the actual plugin with Nuxt/browser boundaries replaced by test doubles.
// No real Google request is made; Vue's real synchronous watchers drive consent.
function setup({ savedChoice = null, hostname = 'vuesmiledental.com', pathname = '/', dev = false } = {}) {
  const choice = ref(savedChoice)
  const enabled = ref(false)
  const scripts = []
  const deletedCookies = []
  const document = {
    referrer: 'https://search.example/private-path?patient=never-send',
    createElement: () => ({}),
    head: { appendChild: script => scripts.push(script) },
    get cookie() { return '_ga=test; _ga_ZR7JNZWXR4=test; clinic_session=keep' },
    set cookie(value) { deletedCookies.push(value) },
  }
  const source = readFileSync(new URL('../plugins/analytics.client.ts', import.meta.url), 'utf8')
    .replaceAll('import.meta.dev', String(dev))
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const exports = {}
  const window = {}
  vm.runInNewContext(output, {
    exports, window, document, URL, Date, watch,
    location: { hostname, pathname, search: '?service=private', hash: '#appointment' },
    defineNuxtPlugin: plugin => plugin,
    useRuntimeConfig: () => ({ public: { gaMeasurementId: 'G-ZR7JNZWXR4', siteUrl: 'https://vuesmiledental.com' } }),
    useAnalyticsConsent: () => ({ enabled, choice, restoreChoice() {} }),
  })
  exports.default()
  const commands = () => Array.from(window.dataLayer || [], args => Array.from(args))
  return { choice, enabled, scripts, window, deletedCookies, commands }
}

test('loads nothing before consent or after rejecting it', () => {
  const app = setup()
  assert.equal(app.enabled.value, true)
  assert.equal(app.scripts.length, 0)
  assert.equal(app.window.dataLayer, undefined)
  app.choice.value = 'denied'
  assert.equal(app.scripts.length, 0)
  assert.equal(app.window.dataLayer, undefined)
})

test('accepted consent sends one sanitized homepage view with ads denied', () => {
  const app = setup({ pathname: '/index.html' })
  app.choice.value = 'granted'
  app.choice.value = 'granted'
  assert.equal(app.scripts.length, 1)
  assert.equal(app.scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-ZR7JNZWXR4')
  const commands = app.commands()
  const views = commands.filter(([kind, name]) => kind === 'event' && name === 'page_view')
  assert.equal(views.length, 1)
  assert.equal(views[0][2].page_location, 'https://vuesmiledental.com/')
  const config = commands.find(([kind]) => kind === 'config')[2]
  assert.equal(config.send_page_view, false)
  assert.equal(config.page_referrer, 'https://search.example')
  assert.equal(config.allow_google_signals, false)
  assert.equal(commands[0][2].ad_storage, 'denied')
  assert.doesNotMatch(JSON.stringify(commands), /patient|private|appointment|service=/)
})

test('withdrawal disables GA and deletes only analytics cookies', () => {
  const app = setup({ savedChoice: 'granted' })
  assert.equal(app.scripts.length, 1)
  app.choice.value = 'denied'
  assert.equal(app.window['ga-disable-G-ZR7JNZWXR4'], true)
  assert.ok(app.deletedCookies.some(value => value.startsWith('_ga=')))
  assert.ok(app.deletedCookies.every(value => !value.includes('clinic_session')))
  assert.equal(app.commands().at(-1)[2].analytics_storage, 'denied')
})

test('development, another host, and non-homepage paths never load Analytics', () => {
  for (const options of [{ dev: true }, { hostname: 'localhost' }, { pathname: '/admin/login' }]) {
    const app = setup({ savedChoice: 'granted', ...options })
    assert.equal(app.enabled.value, false)
    assert.equal(app.scripts.length, 0)
    assert.equal(app.window.dataLayer, undefined)
  }
})
