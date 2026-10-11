<script setup lang="ts">
/**
 * Render a CMS-selected logo. src is an image URL or null; alt is its accessible name.
 * cropOriginal frames the seeded photograph's white margins; disable for a new logo.
 * Example: <ClinicLogo :src="content.logoImage" :alt="content.logoAlt" :crop-original="content.cropOriginalLogo" />
 * No image is rendered when editors clear the selection.
 */
defineProps<{ src: string | null; alt: string; cropOriginal?: boolean }>()
</script>

<template>
  <span class="clinic-logo" :class="{ 'original-photo': cropOriginal }">
    <img v-if="src" :src="src" :alt="alt" />
  </span>
</template>

<style scoped>
.clinic-logo { position: relative; display: block; width: 128px; aspect-ratio: 974 / 740; overflow: hidden; mix-blend-mode: multiply; }
.clinic-logo img { width: 100%; height: 100%; object-fit: contain; }
/* Frame the artwork within the original photo's white margins without altering it. */
.original-photo img { position: absolute; width: 207.7%; max-width: none; height: auto; left: -54%; top: -75.7%; }
</style>
