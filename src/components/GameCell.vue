<template>
  <button
    class="cell"
    :class="[
      `cell-${cell.type}`,
      {
        'is-active': active,
        'is-thin': isThin,
        'is-interactive': cell.interactive
      }
    ]"
    :disabled="!cell.interactive"
    type="button"
    @click="onClick"
  >
    <span>{{ displayValue }}</span>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  cell: { type: Object, required: true },
  active: { type: Boolean, default: false }
})

const emit = defineEmits(['select'])

const isThin = computed(() => {
  return props.cell.type === 'bracket' || props.cell.type === 'pad'
})

const displayValue = computed(() => {
  if (props.cell.type === 'pad') return ''
  return props.cell.value === '' || props.cell.value == null ? '' : props.cell.value
})

function onClick() {
  if (!props.cell.interactive) return
  emit('select', props.cell.id)
}
</script>
