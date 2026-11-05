import { OPS, evaluateText } from './evaluate.js'

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function shuffle(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function chooseParenKind() {
  const r = Math.random()
  if (r < 0.2) return 'one-2'
  if (r < 0.3) return 'one-3'
  if (r < 0.35) return 'two-2-2'
  if (r < 0.375) return 'two-2-3'
  if (r < 0.4) return 'two-3-3'
  return 'none'
}

function nonOverlapping(a, b) {
  return a[1] < b[0] || b[1] < a[0]
}

function chooseSpans(kind) {
  const two = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5]
  ]
  const three = [
    [0, 2],
    [1, 3],
    [2, 4],
    [3, 5]
  ]

  if (kind === 'none') return []
  if (kind === 'one-2') return [pick(two)]
  if (kind === 'one-3') return [pick(three)]
  if (kind === 'two-2-2') {
    const pairs = []
    for (let i = 0; i < two.length; i += 1) {
      for (let j = i + 1; j < two.length; j += 1) {
        if (nonOverlapping(two[i], two[j])) pairs.push([two[i], two[j]])
      }
    }
    return pick(pairs)
  }
  if (kind === 'two-2-3') {
    const pairs = []
    for (const a of two) {
      for (const b of three) {
        if (nonOverlapping(a, b)) pairs.push([a, b])
      }
    }
    return pick(pairs)
  }
  return [
    [0, 2],
    [3, 5]
  ]
}

function buildExpression(numbers, ops, spans) {
  const openAt = [0, 0, 0, 0, 0, 0]
  const closeAt = [0, 0, 0, 0, 0, 0]
  for (const [start, end] of spans) {
    openAt[start] += 1
    closeAt[end] += 1
  }

  let text = ''
  for (let i = 0; i < numbers.length; i += 1) {
    text += '('.repeat(openAt[i])
    text += String(numbers[i])
    text += ')'.repeat(closeAt[i])
    if (i < ops.length) text += ` ${ops[i]} `
  }
  return text
}

function makeNumbers() {
  const small = [randomInt(1, 9), randomInt(1, 9)]
  const large = [randomInt(10, 99), randomInt(10, 99), randomInt(10, 99), randomInt(10, 99)]
  return shuffle([...small, ...large])
}

function getCorrectAnswer(numbers, ops, spans) {
  const cells = []
  const openingBrackets = new Map()
  const closingBrackets = new Map()
  for ( let [start, end] of spans ) {
    openingBrackets.set(start, "(")
    closingBrackets.set(end, ")") 
  }
  for ( let i=0; i <= ops.length; i++ ) {
    cells.push({
      id: `bl-${i}`,
      type: 'left-bracket',
      value: openingBrackets.get(i) ?? "",
      interactive: true
    })
    cells.push({
      id: `n-${i}`,
      type: 'number',
      value: String(numbers[i]),
      sourceId: null,
      interactive: true
    })
    cells.push({
      id: `br-${i}`,
      type: 'right-bracket',
      value: closingBrackets.get(i) ?? "",
      interactive: true
    })
    if (i < ops.length) {
      cells.push({
        id: `op-${i}`,
        type: 'op',
        value: ops[i],
        interactive: true
      })
    }
  }
  cells.push({ id: 'eq', type: 'equals', value: '=', interactive: false })
  return cells
}

export function generateRound(mode, maxAttempts = 8000) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const numbers = makeNumbers()
    const ops = Array.from({ length: 5 }, () => pick(OPS))
    const kind = chooseParenKind()
    const spans = chooseSpans(kind)
    const expression = buildExpression(numbers, ops, spans)
    const answer = getCorrectAnswer(numbers, ops, spans)
    const evaluated = evaluateText(expression)
    if (!evaluated.ok) continue
    if (evaluated.value < 100 || evaluated.value > 999) continue
    return {
      numbers: (mode === "hard" ? shaffleArray : n => n)(numbers),
      target: evaluated.value,
      expression,
      answer,
      kind
    }
  }
  return generateSimpleFallback()
}

function generateSimpleFallback() {
  const numbers = makeNumbers()
  let value = numbers[0]
  const ops = []
  for (let i = 1; i < numbers.length; i += 1) {
    const next = numbers[i]
    if (value + next <= 999) {
      ops.push('+')
      value += next
    } else if (value - next >= 100) {
      ops.push('-')
      value -= next
    } else if (value % next === 0) {
      ops.push('/')
      value /= next
    } else {
      ops.push('+')
      value += next
    }
  }
  const expression = buildExpression(numbers, ops, [])
  const evaluated = evaluateText(expression)
  if (evaluated.ok && evaluated.value >= 100 && evaluated.value <= 999) {
    return {
      numbers,
      target: evaluated.value,
      expression,
      kind: 'none'
    }
  }
  return {
    numbers: [75, 50, 25, 12, 8, 3],
    target: 173,
    expression: '75 + 50 + 25 + 12 + 8 + 3',
    kind: 'none'
  }
}

export function roundTime(level) {
  return 120 - (level - 1) * 10
}

function shaffleArray(arr) {
  for ( let i = arr.length - 1; i >= 0; i-- ) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}