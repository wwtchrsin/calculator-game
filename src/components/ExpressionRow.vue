<template>
  <div class="expression-row">
    <GameCell
      v-for="cell in cells"
      :key="cell.id"
      :cell="cell"
      :active="cell.id === activeId"
      @select="$emit('select', $event)"
    />
  </div>
</template>

<script setup>
import GameCell from './GameCell.vue'

defineProps({
  cells: { type: Array, required: true },
  activeId: { type: String, default: null }
})

defineEmits(['select'])
</script>
