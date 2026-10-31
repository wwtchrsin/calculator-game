<template>
  <div class="app-shell">
    <header class="app-header">calculator game</header>
    <main class="app-main">
      <section class="status-panel">
        <div class="level-label">Level {{ level }}</div>
        <div class="score-bar" aria-label="Level score">
          <span
            v-for="n in 5"
            :key="n"
            class="score-pip"
            :class="{ filled: n <= score }"
          />
        </div>
        <div class="timer-row">
          <div
            class="timer"
            :class="{
              danger: (secondsLeft <= 10 && !roundOver) || (roundOver && !roundWon),
              success: roundOver && roundWon
            }"
          >
            {{ formattedTime }}
          </div>
          <button
            v-if="roundOver"
            class="continue-btn"
            type="button"
            aria-label="Continue"
            @click="continueGame"
          >
            <svg viewBox="0 0 86.6 100" aria-hidden="true">
              <polygon points="0,0 86.6,50 0,100" />
            </svg>
          </button>
        </div>
      </section>

      <section class="board-panel">
        <ExpressionRow :cells="cells" :active-id="activeId" @select="selectCell" />
        <ChoiceBar
          :mode="choiceMode"
          :numbers="available"
          @pick="applyChoice"
          @del="deleteActive"
        />
      </section>

      <section class="steps-panel">
        <ExpressionRow
          v-for="(stepCells, index) in stepRows"
          :key="index"
          :cells="stepCells"
        />
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import ChoiceBar from './components/ChoiceBar.vue'
import ExpressionRow from './components/ExpressionRow.vue'
import { createBoard, formatTime } from './game/board.js'
import { evaluateCells, stepToCells } from './game/evaluate.js'
import { generateRound, roundTime } from './game/generate.js'

const level = ref(1)
const score = ref(0)
const secondsLeft = ref(roundTime(1))
const roundOver = ref(false)
const roundWon = ref(false)
const cells = ref([])
const available = ref([])
const activeId = ref(null)
const stepRows = ref([])
const pendingShift = ref(0)

let timerId = null
let numberSeq = 0

const formattedTime = computed(() => formatTime(secondsLeft.value))

const activeCell = computed(() => cells.value.find((cell) => cell.id === activeId.value) ?? null)

const choiceMode = computed(() => {
  if (roundOver.value || !activeCell.value) return null
  if (activeCell.value.type === 'number') return 'number'
  if (activeCell.value.type === 'op') return 'op'
  if (activeCell.value.type === 'bracket') return 'bracket'
  return null
})

function clearTimer() {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
}

function startTimer() {
  clearTimer()
  timerId = setInterval(() => {
    if (secondsLeft.value <= 0) return
    secondsLeft.value -= 1
    if (secondsLeft.value <= 0) finishRound(false)
  }, 1000)
}

function startRound() {
  const round = generateRound()
  numberSeq = 0
  available.value = round.numbers.map((value) => {
    numberSeq += 1
    return { id: `num-${numberSeq}`, value }
  })
  cells.value = createBoard(round.target)
  activeId.value = null
  stepRows.value = []
  roundOver.value = false
  roundWon.value = false
  secondsLeft.value = roundTime(level.value)
  startTimer()
}

function selectCell(id) {
  if (roundOver.value) return
  const cell = cells.value.find((item) => item.id === id)
  if (!cell?.interactive) return
  activeId.value = id
}

function deactivate() {
  activeId.value = null
}

function patchCell(id, patch) {
  cells.value = cells.value.map((cell) => (cell.id === id ? { ...cell, ...patch } : cell))
}

function applyChoice(payload) {
  const cell = activeCell.value
  if (!cell || roundOver.value) return

  if (cell.type === 'number') {
    const picked = payload
    const returned = []
    if (cell.sourceId && cell.value !== '') {
      returned.push({ id: cell.sourceId, value: Number(cell.value) })
    }
    patchCell(cell.id, { value: String(picked.value), sourceId: picked.id })
    available.value = [...available.value.filter((item) => item.id !== picked.id), ...returned]
  } else if (cell.type === 'op' || cell.type === 'bracket') {
    patchCell(cell.id, { value: payload })
  }

  deactivate()
  afterEdit()
}

function deleteActive() {
  const cell = activeCell.value
  if (!cell || roundOver.value) return

  if (cell.type === 'number' && cell.sourceId && cell.value !== '') {
    available.value = [...available.value, { id: cell.sourceId, value: Number(cell.value) }]
  }
  patchCell(cell.id, { value: '', sourceId: null })
  deactivate()
  afterEdit()
}

function afterEdit() {
  const result = evaluateCells(cells.value)
  if (!result.ok) {
    stepRows.value = result.steps.map(stepToCells)
    return
  }
  stepRows.value = result.steps.map(stepToCells)
  if (result.complete && result.value === Number(cells.value.find((cell) => cell.id === 'result')?.value)) {
    finishRound(true)
  }
}

function finishRound(won) {
  if (roundOver.value) return
  roundOver.value = true
  roundWon.value = won
  clearTimer()
  activeId.value = null

  if (won) {
    score.value += 1
    if (score.value >= 5 && level.value < 10) pendingShift.value = 1
    if (score.value > 5) score.value = 5
  } else if (level.value === 1) {
    score.value = Math.max(0, score.value - 1)
  } else {
    score.value -= 1
    if (score.value < 0) pendingShift.value = -1
  }
}

function continueGame() {
  if (pendingShift.value === 1) {
    level.value += 1
    score.value = 0
  } else if (pendingShift.value === -1) {
    level.value -= 1
    score.value = 0
  }
  pendingShift.value = 0
  startRound()
}

onMounted(() => {
  startRound()
})

onUnmounted(() => {
  clearTimer()
})
</script>
