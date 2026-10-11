/** Published Craft Homepage fields. Plain text is rendered safely by Vue interpolation. */
export interface HomepageContent {
  clinicName: string
  locationShort: string
  announcementText: string
  hoursShort: string
  facebookUrl: string
  messengerUrl: string
  headerCta: string
  skipLink: string
  homeLabel: string
  mainNavLabel: string
  mobileNavLabel: string
  openMenu: string
  closeMenu: string
  logoAlt: string
  logoImage: string | null
  cropOriginalLogo: boolean
  navigation: Array<{ label: string; href: string }>
  seoTitle: string
  seoDescription: string
  ogTitle: string
  ogDescription: string
  heroEyebrow: string
  heroTitle: string
  heroEmphasis: string
  heroDescription: string
  heroPrimaryText: string
  heroSecondaryText: string
  heroNoteTitle: string
  heroNoteText: string
  heroImageAlt: string
  heroCaptionTitle: string
  heroCaptionText: string
  heroSideLabel: string
  heroImage: string | null
  careStrip: Array<{ icon: string; text: string }>
  servicesEyebrow: string
  servicesTitle: string
  servicesEmphasis: string
  servicesDescription: string
  filterLabel: string
  allCareLabel: string
  maintainLabel: string
  restoreLabel: string
  brightenLabel: string
  servicesShown: string
  servicesLoading: string
  servicesError: string
  retryText: string
  servicesEmptyCategory: string
  servicesEmpty: string
  serviceAskLabel: string
  serviceHelpText: string
  serviceHelpLink: string
  storyTop: string
  storyTitle: string
  storyEmphasis: string
  storyLocation: string
  storyLabel: string
  approachEyebrow: string
  approachTitle: string
  approachEmphasis: string
  approachDescription: string
  approachLink: string
  approachPoints: Array<{ title: string; description: string }>
  visitEyebrow: string
  visitTitle: string
  visitEmphasis: string
  visitDescription: string
  visitCta: string
  visitSteps: Array<{ title: string; description: string }>
  faqEyebrow: string
  faqTitle: string
  faqEmphasis: string
  faqDescription: string
  faqCta: string
  faqs: Array<{ question: string; answer: string }>
  appointmentEyebrow: string
  appointmentTitle: string
  appointmentEmphasis: string
  appointmentDescription: string
  appointmentDays: string
  appointmentHours: string
  appointmentDirectLink: string
  formEyebrow: string
  formTitle: string
  serviceLabel: string
  consultationOption: string
  dateLabel: string
  optionalLabel: string
  datePlaceholder: string
  timeLabel: string
  prepareButton: string
  formNote: string
  messageReadyLabel: string
  copyButton: string
  messengerButton: string
  copyInstructions: string
  copySuccess: string
  copyFallback: string
  nextAvailableDate: string
  messageTemplate: string
  timeOptions: Array<{ label: string }>
  locationEyebrow: string
  locationTitle: string
  locationEmphasis: string
  locationDescription: string
  addressTitle: string
  address: string
  hoursTitle: string
  hoursDetail: string
  contactTitle: string
  contactDescription: string
  facebookLinkText: string
  mapQuery: string
  mapTitle: string
  mapLabel: string
  mapLinkText: string
  footerTagline: string
  footerNavLabel: string
  copyrightName: string
  footerNote: string
  backToTop: string
  footerNavigation: Array<{ label: string; href: string }>
}
