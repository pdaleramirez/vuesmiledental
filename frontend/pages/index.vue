<script setup lang="ts">
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import type { ServiceGroup } from '~/types/services'

// Craft's homepage redirect lands here; keep that URL valid after Nuxt hydrates.
definePageMeta({ alias: '/index.html' })

type CareGroup = 'All care' | ServiceGroup
const { data: content, error: contentError, refresh: refreshContent } = await useHomepageContent()
const activeGroup = ref<CareGroup>('All care')
const menuOpen = ref(false)
const groups: CareGroup[] = ['All care', 'Maintain', 'Restore', 'Brighten']
const { data: serviceData, status: servicesStatus, error: servicesError, refresh: refreshServices } = await useDentalServices()
const services = computed(() => serviceData.value ?? [])
const servicesLoading = computed(() => servicesStatus.value === 'idle' || servicesStatus.value === 'pending')
const visibleServices = computed(() => services.value.filter(service => activeGroup.value === 'All care' || service.group === activeGroup.value))
const faqs = computed(() => content.value?.faqs ?? [])
const selectedService = ref('')
const preferredDate = ref('')
const preferredTime = ref('')
const earliestDate = ref('')
const currentYear = ref(new Date().getFullYear())
const availableYears = computed(() => [currentYear.value, currentYear.value + 100])
const preparedMessage = ref('')
const copyStatus = ref('')
const messageField = ref<HTMLTextAreaElement | null>(null)
const messengerUrl = computed(() => safeHref(content.value?.messengerUrl ?? ''))
const facebookUrl = computed(() => safeHref(content.value?.facebookUrl ?? ''))
// Reset a selected service if an editor removes it and the list is refreshed.
watch(services, items => {
  if (selectedService.value !== content.value?.consultationOption && !items.some(item => item.name === selectedService.value)) {
    chooseService(content.value?.consultationOption ?? '')
  }
})
// Use the same clinic search for the embedded map and the full Google Maps link.
const clinicMapQuery = computed(() => encodeURIComponent(content.value?.mapQuery ?? ''))
const directionsUrl = computed(() => `https://www.google.com/maps/search/?api=1&query=${clinicMapQuery.value}`)
const mapEmbedUrl = computed(() => `https://www.google.com/maps?q=${clinicMapQuery.value}&z=16&output=embed`)

// Preserve stable filter values while allowing their visible labels to be edited.
const groupLabels = computed(() => ({
  'All care': content.value?.allCareLabel, Maintain: content.value?.maintainLabel,
  Restore: content.value?.restoreLabel, Brighten: content.value?.brightenLabel,
}))
watch(content, (value, previous) => {
  if (!value) return
  if (!selectedService.value || selectedService.value === previous?.consultationOption) selectedService.value = value.consultationOption
  if (!value.timeOptions.some(option => option.label === preferredTime.value)) preferredTime.value = value.timeOptions[0]?.label ?? ''
}, { immediate: true })
useSeoMeta({
  title: () => content.value?.seoTitle || content.value?.clinicName || '',
  description: () => content.value?.seoDescription ?? '',
  ogTitle: () => content.value?.ogTitle ?? '',
  ogDescription: () => content.value?.ogDescription ?? '',
  ogType: 'website',
})

/**
 * Validate a CMS link. Accepts https/http URLs and local anchors/paths; returns '#'
 * for unsafe schemes. Example: safeHref(content.facebookUrl). No HTML is rendered.
 */
function safeHref(value: string): string {
  if (/^(https?:\/\/|#|\/(?!\/))/i.test(value.trim())) return value.trim()
  return '#'
}

onMounted(() => {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const value = (type: string) => parts.find(part => part.type === type)?.value
  currentYear.value = Number(value('year'))
  earliestDate.value = `${value('year')}-${value('month')}-${value('day')}`
})

function chooseService(name: string) {
  selectedService.value = name
  preparedMessage.value = ''
  copyStatus.value = ''
}

function prepareMessage() {
  const date = preferredDate.value
    ? new Intl.DateTimeFormat('en-PH', { dateStyle: 'long', timeZone: 'Asia/Manila' }).format(new Date(`${preferredDate.value}T12:00:00+08:00`))
    : content.value?.nextAvailableDate ?? ''
  preparedMessage.value = (content.value?.messageTemplate ?? '').replace(/\{(service|date|time)\}/g, (_, key: 'service' | 'date' | 'time') => ({ service: selectedService.value, date, time: preferredTime.value })[key] ?? '')
  copyStatus.value = ''
  nextTick(() => messageField.value?.focus())
}

async function copyMessage() {
  try {
    await navigator.clipboard.writeText(preparedMessage.value)
    copyStatus.value = content.value?.copySuccess ?? ''
  } catch {
    messageField.value?.focus()
    messageField.value?.select()
    copyStatus.value = content.value?.copyFallback ?? ''
  }
}
</script>

<template>
  <div v-if="content" class="clinic-site" @keydown.esc="menuOpen = false">
    <a class="skip-link" href="#main">{{ content.skipLink }}</a>
    <div class="announcement">
      <div class="site-container announcement-inner">
        <span><ClinicIcon name="pin" /> {{ content.locationShort }}</span>
        <p>{{ content.announcementText }}</p>
        <span><ClinicIcon name="clock" /> {{ content.hoursShort }}</span>
      </div>
    </div>

    <header class="site-header">
      <div class="site-container header-inner">
        <a href="#home" class="brand-link" :aria-label="content.homeLabel"><ClinicLogo :src="content.logoImage" :alt="content.logoAlt" :crop-original="content.cropOriginalLogo" /></a>
        <nav class="desktop-nav" :aria-label="content.mainNavLabel">
          <a v-for="(link, index) in content.navigation" :key="index" :href="safeHref(link.href)">{{ link.label }}</a>
        </nav>
        <a class="button button-primary header-cta" href="#appointment">{{ content.headerCta }} <ClinicIcon name="diagonal" /></a>
        <button class="menu-toggle" type="button" :aria-expanded="menuOpen" aria-controls="mobile-navigation" :aria-label="menuOpen ? content.closeMenu : content.openMenu" @click="menuOpen = !menuOpen">
          <ClinicIcon :name="menuOpen ? 'close' : 'menu'" />
        </button>
      </div>
      <nav v-if="menuOpen" id="mobile-navigation" class="mobile-nav" :aria-label="content.mobileNavLabel" @click="menuOpen = false">
        <a v-for="(link, index) in content.navigation" :key="index" :href="safeHref(link.href)">{{ link.label }}</a><a href="#appointment">{{ content.headerCta }} <ClinicIcon name="arrow" /></a>
      </nav>
    </header>

    <main id="main">
      <section id="home" class="hero">
        <div class="site-container hero-grid">
          <div class="hero-copy">
            <p class="eyebrow"><span class="gold-line" /> {{ content.heroEyebrow }}</p>
            <h1>{{ content.heroTitle }} <em>{{ content.heroEmphasis }}</em></h1>
            <p class="hero-description">{{ content.heroDescription }}</p>
            <div class="hero-actions">
              <a class="button button-primary" href="#appointment">{{ content.heroPrimaryText }} <ClinicIcon name="arrow" /></a>
              <a class="text-link" href="#services">{{ content.heroSecondaryText }} <ClinicIcon name="diagonal" /></a>
            </div>
            <div class="hero-note"><span class="note-icon"><ClinicIcon name="chat" /></span><p>{{ content.heroNoteTitle }}<br /><span>{{ content.heroNoteText }}</span></p></div>
          </div>
          <div class="hero-visual">
            <div class="hero-image-frame"><img :src="content.heroImage || undefined" :alt="content.heroImageAlt" v-if="content.heroImage" width="1122" height="1402" fetchpriority="high" /></div>
            <div class="hero-caption"><span class="caption-mark"><ClinicIcon name="sparkle" /></span><div><strong>{{ content.heroCaptionTitle }}</strong><span>{{ content.heroCaptionText }}</span></div></div>
            <span class="hero-side-label" aria-hidden="true">{{ content.heroSideLabel }}</span>
          </div>
        </div>
      </section>

      <div class="care-strip">
        <div class="site-container care-strip-inner">
          <span v-for="(item, index) in content.careStrip" :key="index"><ClinicIcon :name="item.icon" /> {{ item.text }}</span>
        </div>
      </div>

      <section id="services" class="section services-section">
        <div class="site-container">
          <div class="section-heading services-heading">
            <div><p class="eyebrow">{{ content.servicesEyebrow }}</p><h2>{{ content.servicesTitle }} <em>{{ content.servicesEmphasis }}</em></h2></div>
            <p>{{ content.servicesDescription }}</p>
          </div>
          <div class="service-filters" :aria-label="content.filterLabel">
            <button v-for="group in groups" :key="group" type="button" :class="{ active: activeGroup === group }" :aria-pressed="activeGroup === group" @click="activeGroup = group">{{ groupLabels[group] }}</button>
          </div>
          <p class="sr-only" role="status">{{ visibleServices.length }} {{ content.servicesShown }}</p>
          <p v-if="servicesLoading" class="services-notice" role="status">{{ content.servicesLoading }}</p>
          <div v-else-if="servicesError" class="services-notice" role="alert"><p>{{ content.servicesError }}</p><button type="button" class="button button-outline" @click="refreshServices()">{{ content.retryText }} <ClinicIcon name="restore" /></button></div>
          <p v-else-if="!visibleServices.length" class="services-notice" role="status">{{ services.length ? content.servicesEmptyCategory : content.servicesEmpty }}</p>
          <div v-else class="service-grid">
            <article v-for="service in visibleServices" :key="service.id" class="service-card">
              <div class="service-card-top"><span class="service-icon"><ClinicIcon :name="service.icon" /></span><span class="service-category">{{ groupLabels[service.group] }}</span></div>
              <h3>{{ service.name }}</h3>
              <p>{{ service.description }}</p>
              <a href="#appointment" class="service-link" :aria-label="content.serviceAskLabel.replace('{service}', service.name)" @click="chooseService(service.name)">{{ service.tag }} <ClinicIcon name="arrow" /></a>
            </article>
          </div>
          <div class="service-help"><ClinicIcon name="chat" /><p>{{ content.serviceHelpText }} <a href="#appointment" @click="chooseService(content.consultationOption)">{{ content.serviceHelpLink }}</a></p></div>
        </div>
      </section>

      <section id="approach" class="section approach-section">
        <div class="site-container approach-grid">
          <div class="brand-story" :aria-label="content.storyLabel">
            <span class="brand-story-top">{{ content.storyTop }}</span>
            <div class="brand-story-logo"><ClinicLogo :src="content.logoImage" :alt="content.logoAlt" :crop-original="content.cropOriginalLogo" /></div>
            <p>{{ content.storyTitle }}<br /><em>{{ content.storyEmphasis }}</em></p>
            <span class="brand-story-bottom"><ClinicIcon name="pin" /> {{ content.storyLocation }}</span>
          </div>
          <div class="approach-copy">
            <p class="eyebrow">{{ content.approachEyebrow }}</p>
            <h2>{{ content.approachTitle }}<br /><em>{{ content.approachEmphasis }}</em></h2>
            <p class="section-description">{{ content.approachDescription }}</p>
            <div class="approach-points">
              <div v-for="(point, index) in content.approachPoints" :key="index"><span>{{ String(index + 1).padStart(2, '0') }}</span><div><h3>{{ point.title }}</h3><p>{{ point.description }}</p></div></div>
            </div>
            <a class="text-link" :href="facebookUrl" target="_blank" rel="noopener noreferrer">{{ content.approachLink }} <ClinicIcon name="diagonal" /></a>
          </div>
        </div>
      </section>

      <section id="your-visit" class="section visit-section">
        <div class="site-container">
          <div class="section-heading centered"><p class="eyebrow">{{ content.visitEyebrow }}</p><h2>{{ content.visitTitle }} <em>{{ content.visitEmphasis }}</em></h2><p>{{ content.visitDescription }}</p></div>
          <div class="visit-steps">
            <article v-for="(step, index) in content.visitSteps" :key="index"><span class="step-number">{{ String(index + 1).padStart(2, '0') }}</span><h3>{{ step.title }}</h3><p>{{ step.description }}</p></article>
          </div>
          <a class="button button-outline" href="#appointment">{{ content.visitCta }} <ClinicIcon name="arrow" /></a>
        </div>
      </section>

      <section id="questions" class="section faq-section">
        <div class="site-container faq-grid">
          <div><p class="eyebrow">{{ content.faqEyebrow }}</p><h2>{{ content.faqTitle }}<br /><em>{{ content.faqEmphasis }}</em></h2><p class="section-description">{{ content.faqDescription }}</p><a class="text-link" :href="messengerUrl" target="_blank" rel="noopener noreferrer">{{ content.faqCta }} <ClinicIcon name="diagonal" /></a></div>
          <div class="faq-list">
            <details v-for="faq in faqs" :key="faq.question"><summary>{{ faq.question }}<ClinicIcon name="plus" /></summary><p>{{ faq.answer }}</p></details>
          </div>
        </div>
      </section>

      <section id="appointment" class="section appointment-section">
        <div class="site-container appointment-grid">
          <div class="appointment-copy"><p class="eyebrow">{{ content.appointmentEyebrow }}</p><h2>{{ content.appointmentTitle }} <em>{{ content.appointmentEmphasis }}</em></h2><p>{{ content.appointmentDescription }}</p><div class="appointment-note"><ClinicIcon name="calendar" /><p>{{ content.appointmentDays }}<br /><strong>{{ content.appointmentHours }}</strong></p></div><a class="text-link light-link" :href="messengerUrl" target="_blank" rel="noopener noreferrer">{{ content.appointmentDirectLink }} <ClinicIcon name="diagonal" /></a></div>
          <form class="appointment-form" @submit.prevent="prepareMessage">
            <p class="form-eyebrow">{{ content.formEyebrow }}</p>
            <h3>{{ content.formTitle }}</h3>
            <label for="appointment-service">{{ content.serviceLabel }}</label>
            <select id="appointment-service" v-model="selectedService" @change="preparedMessage = ''; copyStatus = ''"><option>{{ content.consultationOption }}</option><option v-for="service in services" :key="service.id">{{ service.name }}</option></select>
            <div class="form-row"><div><label for="dp-input-appointment-date">{{ content.dateLabel }} <span>{{ content.optionalLabel }}</span></label>
              <VueDatePicker
                v-model="preferredDate"
                class="preferred-date-picker"
                uid="appointment-date"
                :aria-labels="{ input: `${content.dateLabel} ${content.optionalLabel}` }"
                model-type="yyyy-MM-dd"
                format="MMMM d, yyyy"
                month-name-format="long"
                :placeholder="content.datePlaceholder"
                :enable-time-picker="false"
                :min-date="earliestDate || undefined"
                :start-date="earliestDate || undefined"
                :year-range="availableYears"
                prevent-min-max-navigation
                auto-apply
                @update:model-value="preparedMessage = ''; copyStatus = ''"
              /></div><div><label for="appointment-time">{{ content.timeLabel }}</label><select id="appointment-time" v-model="preferredTime" @change="preparedMessage = ''; copyStatus = ''"><option v-for="(option, index) in content.timeOptions" :key="index">{{ option.label }}</option></select></div></div>
            <button type="submit" class="button button-primary form-submit">{{ content.prepareButton }} <ClinicIcon name="arrow" /></button>
            <p class="form-note">{{ content.formNote }}</p>
            <div v-if="preparedMessage" class="prepared-message"><label for="appointment-message">{{ content.messageReadyLabel }}</label><textarea id="appointment-message" ref="messageField" :value="preparedMessage" readonly rows="5" /><div class="message-actions"><button type="button" class="button button-outline" @click="copyMessage"><ClinicIcon name="copy" /> {{ content.copyButton }}</button><a class="button button-primary" :href="messengerUrl" target="_blank" rel="noopener noreferrer">{{ content.messengerButton }} <ClinicIcon name="diagonal" /></a></div><p role="status" class="copy-status">{{ copyStatus || content.copyInstructions }}</p></div>
          </form>
        </div>
      </section>

      <section id="find-us" class="section location-section">
        <div class="site-container location-grid">
          <div>
            <p class="eyebrow">{{ content.locationEyebrow }}</p>
            <h2>{{ content.locationTitle }}<br /><em>{{ content.locationEmphasis }}</em></h2>
            <p class="section-description">{{ content.locationDescription }}</p>
            <div class="location-details">
              <div><span class="location-icon"><ClinicIcon name="pin" /></span><div><h3>{{ content.addressTitle }}</h3><address>{{ content.address }}</address></div></div>
              <div><span class="location-icon"><ClinicIcon name="clock" /></span><div><h3>{{ content.hoursTitle }}</h3><p>{{ content.hoursDetail }}</p></div></div>
              <div><span class="location-icon"><ClinicIcon name="chat" /></span><div><h3>{{ content.contactTitle }}</h3><p>{{ content.contactDescription }}</p><a :href="facebookUrl" target="_blank" rel="noopener noreferrer">{{ content.facebookLinkText }} <ClinicIcon name="diagonal" /></a></div></div>
            </div>
          </div>
          <div class="location-map">
            <iframe
              :src="mapEmbedUrl"
              :title="content.mapTitle"
              width="600"
              height="440"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              allowfullscreen
            />
            <div class="location-map-footer">
              <span><ClinicIcon name="pin" /> {{ content.mapLabel }}</span>
              <a class="button button-outline" :href="directionsUrl" target="_blank" rel="noopener noreferrer">{{ content.mapLinkText }} <ClinicIcon name="diagonal" /></a>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="site-footer"><div class="site-container"><div class="footer-main"><a href="#home" :aria-label="content.homeLabel"><ClinicLogo :src="content.logoImage" :alt="content.logoAlt" :crop-original="content.cropOriginalLogo" /></a><p>{{ content.footerTagline }}</p><nav :aria-label="content.footerNavLabel"><a v-for="(link, index) in content.footerNavigation" :key="index" :href="safeHref(link.href)" :target="/^https?:/.test(link.href) ? '_blank' : undefined" rel="noopener noreferrer">{{ link.label }}</a></nav></div><div class="footer-bottom"><p>© {{ new Date().getFullYear() }} {{ content.copyrightName }}</p><span>{{ content.footerNote }}</span><a href="#home">{{ content.backToTop }}</a></div></div></footer>
  </div>
  <main v-else class="homepage-loading" aria-live="polite">
    <template v-if="contentError"><p>The homepage could not be loaded.</p><button class="button button-outline" type="button" @click="refreshContent()">Try again</button></template>
    <p v-else>Loading…</p>
  </main>
</template>

<style src="../assets/css/homepage.css"></style>
