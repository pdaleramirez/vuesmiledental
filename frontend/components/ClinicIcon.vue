<script setup lang="ts">
withDefaults(defineProps<{ name?: string }>(), { name: 'tooth' })

const paths: Record<string, string[]> = {
  tooth: ['M12 5c-2-1-4-3-7-1S3 10 4 14s2 7 4 7 2-5 4-5 2 5 4 5 3-3 4-7 2-8-1-10-5 0-7 1Z', 'M8 4c1 2 3 3 5 3'],
  sparkle: ['m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z', 'M20 2v4M18 4h4'],
  crown: ['m3 7 4 4 5-7 5 7 4-4-2 11H5L3 7Z', 'M5 21h14'],
  shield: ['M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z', 'm8 12 3 3 5-6'],
  smile: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', 'M8 14s1.5 3 4 3 4-3 4-3', 'M8 9h.01M16 9h.01'],
  restore: ['M3 11a9 9 0 1 1 2.5 7', 'M3 4v7h7', 'M12 8v5l3 2'],
  arrow: ['M4 12h16', 'm14 6 6 6-6 6'],
  diagonal: ['M6 18 18 6M6 6h12v12'],
  pin: ['M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z', 'M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'],
  clock: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', 'M12 7v5l3 2'],
  chat: ['M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5A8.5 8.5 0 0 1 10.5 3h2a8.5 8.5 0 0 1 8.5 8.5Z', 'M7 10h9M7 14h6'],
  calendar: ['M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z', 'M7 3v4M17 3v4M3 11h18M7 15h2M15 15h2'],
  check: ['m5 12 4 4L19 6'],
  plus: ['M12 5v14M5 12h14'],
  menu: ['M4 7h16M4 12h16M4 17h16'],
  close: ['m6 6 12 12M6 18 18 6'],
  copy: ['M9 9h11v12H9V9Z', 'M15 5V3H3v12h2'],
}
</script>

<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path v-for="(path, index) in paths[name] || paths.tooth" :key="index" :d="path" />
  </svg>
</template>
