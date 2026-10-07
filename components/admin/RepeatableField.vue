<template><div class="repeatable"><span class="form-field-label">{{ label }}</span><div v-for="(item,index) in modelValue" :key="index" class="repeat-item"><input :value="item" :placeholder="placeholder" @input="set(index, ($event.target as HTMLInputElement).value)" /><button type="button" class="icon-button" :aria-label="`Удалить пункт ${index + 1}`" @click="remove(index)">−</button></div><button type="button" class="text-button" @click="add">+ Добавить пункт</button><small v-if="error" class="field-error">{{ error }}</small></div></template>
<script setup lang="ts">
const props = defineProps<{ modelValue: string[]; label: string; placeholder?: string; error?: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string[]] }>();
function set(index: number, value: string) { const next = [...props.modelValue]; next[index] = value; emit("update:modelValue", next); }
function remove(index: number) { emit("update:modelValue", props.modelValue.filter((_, itemIndex) => index !== itemIndex)); }
function add() { emit("update:modelValue", [...props.modelValue, ""]); }
</script>
