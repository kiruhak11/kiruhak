<template><label class="form-field"><span>{{ label }}</span><slot /><small v-if="error" class="field-error">{{ error }}</small></label></template>
<script setup lang="ts">defineProps<{ label: string; error?: string }>();</script>
