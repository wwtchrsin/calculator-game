<template>
  <header class="app-header">
    <svg viewBox="0 0 136 136">
      <rect
        style="fill:#ffffff;fill-opacity:1;stroke:#3591ff;stroke-width:10.2;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1;paint-order:fill markers stroke"
        id="rect4"
        width="126.76821"
        height="127.41171"
        x="4.8324714"
        y="4.537786" />
      <rect
        style="fill:#3591ff;fill-opacity:1;stroke:none;stroke-width:8;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1;paint-order:fill markers stroke"
        id="rect16"
        width="21.41264"
        height="21.41264"
        x="26.024439"
        y="89.015808" />
      <rect
        style="fill:#3591ff;fill-opacity:1;stroke:none;stroke-width:8;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1;paint-order:fill markers stroke"
        id="rect16-8"
        width="21.41264"
        height="21.41264"
        x="57.27039"
        y="88.631958" />
      <rect
        style="fill:#e4e503;fill-opacity:1;stroke:none;stroke-width:8;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1;paint-order:fill markers stroke"
        id="rect16-1"
        width="21.41264"
        height="21.41264"
        x="89.679184"
        y="88.724152" />
      <rect
        style="fill:#3591ff;fill-opacity:1;stroke:none;stroke-width:8;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1;paint-order:fill markers stroke"
        id="rect16-2"
        width="21.41264"
        height="21.41264"
        x="26.592859"
        y="57.061657" />
      <rect
        style="fill:#3591ff;fill-opacity:1;stroke:none;stroke-width:8;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1;paint-order:fill markers stroke"
        id="rect16-6"
        width="21.41264"
        height="21.41264"
        x="57.585827"
        y="57.49625" />
      <rect
        style="fill:#21d926;fill-opacity:1;stroke:none;stroke-width:8;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1;paint-order:fill markers stroke"
        id="rect16-18"
        width="21.41264"
        height="21.41264"
        x="89.825294"
        y="57.049763" />
      <rect
        style="fill:#ff2a22;fill-opacity:1;stroke:none;stroke-width:8.73578;stroke-linecap:round;stroke-dasharray:none;stroke-opacity:1;paint-order:fill markers stroke"
        id="rect24"
        width="84.895592"
        height="19.80669"
        x="26.373823"
        y="26.968243" />
    </svg>
    <div class="app-name">calculator game</div>
    <button 
      v-if="roundOver"
      class="toggle-mode-btn is-interactive"
      type="button"
      aria-label="Toggle Mode"
      @click="$emit('toggle-mode', $event)"
    >
      {{  mode === "hard" ? "H" : "N" }}
    </button>

  </header>
</template>

<script setup>
  defineProps({
    mode: { type: String, required: true },
    roundOver: { type: Boolean, required: true },
  })

  defineEmits(['toggle-mode'])
</script>