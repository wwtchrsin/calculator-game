<template>
  <div v-if="mode" class="choice-bar">
    <button
      v-for="item in items"
      :key="item.id"
      class="cell"
      :class="item.className"
      type="button"
      @click="$emit('pick', item.value)"
    >
      {{ item.label }}
    </button>
    <button class="cell cell-del" type="button" @click="$emit('del')">
      del
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  mode: { type: String, default: null },
  numbers: { type: Array, default: () => [] }
})

defineEmits(['pick', 'del'])

const items = computed(() => {
  if (props.mode === 'number') {
    return props.numbers.map((item) => ({
      id: item.id,
      value: item,
      label: item.value,
      className: 'cell-number'
    }))
  }
  if (props.mode === 'op') {
    return ['+', '-', '/', '*'].map((op) => ({
      id: op,
      value: op,
      label: op,
      className: 'cell-op'
    }))
  }
  if (props.mode === 'bracket') {
    return ['(', ')'].map((bracket) => ({
      id: bracket,
      value: bracket,
      label: bracket,
      className: 'cell-bracket'
    }))
  }
  return []
})
</script>
