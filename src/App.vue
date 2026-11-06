<template>
  <div class="app-shell">
    <AppHeader
      :mode="mode"
      :roundOver="roundOver"
      @toggle-mode="toggleMode"
    />
    <main class="app-main">
      <div class="main-panels">
        <section class="status-panel">
          <div class="level-status">
            <div class="level-label">
              {{ mode === "hard" ? "H" : "N" }}{{ currentLevel }}
            </div>
            <div class="score-bar" aria-label="Level score">
              <span
                v-for="n in 5"
                :key="n"
                class="score-pip"
                :class="{ filled: n <= currentScore }"
              />
            </div>
          </div>
          <button
            v-if="!roundOver"
            class="give-up-btn"
            type="button"
            aria-label="Give Up"
            @click="giveUp"
          >
            <svg aria-hidden="true">
              <g id="layer1">
                <rect
                  style="stroke-linecap:round;paint-order:fill markers stroke;stroke:none;fill-opacity:1"
                  id="rect1"
                  width="180"
                  height="180"
                  x="0"
                  y="0" />
              </g>
            </svg>
          </button>  
          <button
            v-if="roundOver"
            class="continue-btn"
            type="button"
            aria-label="Continue"
            @click="startRound"
          >
            <svg viewBox="0 0 86.6 100" aria-hidden="true">
              <polygon points="0,0 86.6,50 0,100" />
            </svg>
          </button>
          <button
            v-if="round && roundOver && !roundWon"
            class="correct-answer-btn"
            :class="showCorrectAnswer ? 'inactive' : 'active'"
            type="button"
            aria-label="Show Answer"
            @click="toggleAnswer"
            >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12.84,17.64q0.36-0.36 0.36-0.89t-0.36-0.89T11.95,15.5t-0.89,0.36q-0.36,0.36-0.36,0.89t0.36,0.89T11.95,18t0.89-0.36Zm-1.79-3.49H12.9q0-0.82 0.19-1.3t1.06-1.3q0.65-0.65 1.03-1.24T15.55,8.9q0-1.4-1.03-2.15T12.1,6Q10.68,6 9.79,6.75T8.55,8.55L10.2,9.2q0.13-0.45 0.56-0.97T12.1,7.7q0.8,0 1.2,0.44T13.7,9.1q0,0.5-0.3,0.94t-0.75,0.81q-1.1,0.97-1.35,1.47t-0.25,1.82ZM12,22q-2.07,0-3.9-0.79q-1.82-0.79-3.17-2.14Q3.58,17.73 2.79,15.9T2,12Q2,9.92 2.79,8.1Q3.58,6.27 4.93,4.93Q6.28,3.57 8.1,2.79Q9.93,2 12,2t3.9,0.79t3.17,2.14q1.35,1.35 2.14,3.17Q22,9.92 22,12t-0.79,3.9t-2.14,3.17q-1.35,1.35-3.17,2.14T12,22Zm0-2q3.35,0 5.68-2.32T20,12T17.68,6.32T12,4T6.33,6.32T4,12t2.33,5.68T12,20Zm0-8Z"/>
            </svg>
          </button>
          <div class="timer-container">
            <div
              v-if="round"
              class="timer"
              :class="{
                danger: (secondsLeft <= 10 && !roundOver) || (roundOver && !roundWon),
                success: roundOver && roundWon
              }"
            >
              {{ formattedTime }}
            </div>
          </div>
        </section>

        <section class="board-panel" v-if="round">
          <ExpressionRow :cells="cells" :active-id="activeId" @select="selectCell" />
          <div class="expression-target-row">
            <div class="expression-target">
              {{ target }}
            </div>
            <button
              class="reset-btn is-interactive"
              type="button"
              aria-label="Reset"
              @click="resetExpression"
            >C</button>
          </div>
          <ChoiceBar
            :mode="choiceMode"
            :numbers="available"
            @pick="applyChoice"
            @del="deleteActive"
          />
        </section>
      </div>
      <section class="steps-panel">
        <template v-if="round">
          <ExpressionRow
            v-for="(stepCells, index) in stepRows"
            :key="index"
            :cells="stepCells"
          />
        </template>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import ChoiceBar from './components/ChoiceBar.vue'
import ExpressionRow from './components/ExpressionRow.vue'
import { createBoard, formatTime } from './game/board.js'
import { evaluateCells, stepToCells, excludeBracketCells } from './game/evaluate.js'
import { generateRound, roundTime } from './game/generate.js'
import { loadData, saveData, saveMode } from './game/storage.js'
import AppHeader from './components/AppHeader.vue'

const mode = ref("normal")
const level = ref(1)
const score = ref(0)
const currentLevel = ref(1)
const currentScore = ref(0)
const secondsLeft = ref(roundTime(1))
const round = ref(null)
const roundOver = ref(true)
const roundWon = ref(false)
const correctAnswer = ref([])
const userAnswer = ref([])
const cells = ref([])
const target = ref(-1)
const available = ref([])
const activeId = ref(null)
const stepRows = ref([])
const showCorrectAnswer = ref(false)

let timerId = null
let numberSeq = 0

const formattedTime = computed(() => formatTime(secondsLeft.value))

const activeCell = computed(() => cells.value.find((cell) => cell.id === activeId.value) ?? null)

const choiceMode = computed(() => {
  if (roundOver.value || !activeCell.value) return null
  if (activeCell.value.type === 'number') return 'number'
  if (activeCell.value.type === 'op') return 'op'
  if (activeCell.value.type === 'left-bracket') return 'left-bracket'
  if (activeCell.value.type === 'right-bracket') return 'right-bracket'
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

function resetAvailable() {
  available.value = round.value.numbers.map((value) => {
    numberSeq += 1
    return { id: `num-${numberSeq}`, value }
  })
}

function startRound() {
  round.value = generateRound(mode.value)
  numberSeq = 0
  resetAvailable()
  target.value = round.value.target
  cells.value = createBoard(mode.value === "hard" ? [] : round.value.numbers)
  correctAnswer.value = round.value.answer
  stepRows.value = []
  roundOver.value = false
  roundWon.value = false
  secondsLeft.value = roundTime(level.value)
  showCorrectAnswer.value = false
  currentLevel.value = level.value
  currentScore.value = score.value
  selectCell(mode.value === "hard" ? cells.value[1].id : cells.value[3].id)
  startTimer()
  saveData(mode.value, { 
    level: level.value,
    score: score.value,
    started: true,
  })
}

function selectCell(id) {
  if (roundOver.value) return
  const cell = cells.value.find((item) => item.id === id)
  if (!cell?.interactive) return
  activeId.value = id
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
  } else if (cell.type === 'op' || cell.type === 'left-bracket' || cell.type === 'right-bracket') {
    patchCell(cell.id, { value: payload })
  }
  afterEdit()
}

function deleteActive() {
  const cell = activeCell.value
  if (!cell || roundOver.value) return

  if (cell.type === 'number' && cell.sourceId && cell.value !== '') {
    available.value = [...available.value, { id: cell.sourceId, value: Number(cell.value) }]
  }
  patchCell(cell.id, { value: '', sourceId: null })
  afterEdit()
}

function afterEdit() {
  const result = evaluateCells(cells.value)
  stepRows.value = excludeBracketCells(result.steps.map(stepToCells))
  if (result.ok && result.complete && result.value === target.value) {
    finishRound(true)
  }
}

function finishRound(won) {
  if (roundOver.value) return
  userAnswer.value = cells.value
  roundOver.value = true
  roundWon.value = won
  clearTimer()
  activeId.value = null

  if (won) {
    score.value += 1
    currentScore.value = Math.min(score.value, 5)
    if (score.value >= 5 && level.value < 10) {
      score.value = 0
      level.value += 1
    } else if (score.value > 5) {
      score.value = 5
    }
  } else {
    score.value -= 1
    currentScore.value = Math.max(score.value, 0)
    if (score.value < 0 && level.value > 1) {
      score.value = 5
      level.value -= 1
    } else if (score.value < 0) {
      score.value = 0
    }
  }

  saveData(mode.value, { 
    level: level.value,
    score: score.value,
    started: false,
  })
}

function toggleAnswer() {
  if (showCorrectAnswer.value) {
    showCorrectAnswer.value = false
    cells.value = userAnswer.value
    afterEdit()
  } else {
    showCorrectAnswer.value = true
    cells.value = correctAnswer.value
    afterEdit()
  }
}

function toggleMode() {
  mode.value = mode.value === "normal" ? "hard" : "normal"
  saveMode(mode.value)
  loadSave()
  round.value = null
}

function giveUp() {
  finishRound(false)
}

function resetExpression() {
  if (!roundOver.value) {
    cells.value = createBoard(mode.value === "hard" ? [] : round.value.numbers)
    resetAvailable()
    afterEdit()
    selectCell(mode.value === "hard" ? cells.value[1].id : cells.value[3].id)
  }
}

function loadSave() {
  const data = loadData()
  if (data.started) {
    if (data.score > 0) {
      data.score--
    } else if (data.level > 1) {
      data.level--
      data.score = 5
    }
  }
  mode.value = data.mode
  level.value = data.level
  score.value = data.score
}

onMounted(() => {
  loadSave()
})

onUnmounted(() => {
  clearTimer()
})
</script>
