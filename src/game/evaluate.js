export const OPS = ['+', '-', 'x', '/']

export function applyOp(left, op, right) {
  if (!Number.isInteger(left) || !Number.isInteger(right)) {
    return { ok: false, reason: 'fraction' }
  }
  if (op === '+') return { ok: true, value: left + right }
  if (op === '-') return { ok: true, value: left - right }
  if (op === 'x') return { ok: true, value: left * right }
  if (op === '/') {
    if (right === 0) return { ok: false, reason: 'divzero' }
    if (left % right !== 0) return { ok: false, reason: 'fraction' }
    return { ok: true, value: left / right }
  }
  return { ok: false, reason: 'op' }
}

function sourceOf(node) {
  return node.source
}

function makeNumber(value, source) {
  return { kind: 'number', value, source: source ?? String(value) }
}

function makeOp(op) {
  return { kind: 'op', op, source: op }
}

function makeGroup(inner, wrapped) {
  return {
    kind: 'group',
    inner,
    source: wrapped ? `(${inner.source})` : inner.source
  }
}

function makeBinary(left, op, right) {
  const padL = left.kind === 'group' ? left.source : left.source
  const padR = right.kind === 'group' ? right.source : right.source
  return {
    kind: 'binary',
    left,
    op,
    right,
    source: `${padL} ${op} ${padR}`
  }
}

export function tokenize(text) {
  const tokens = []
  const re = /\s+|\d+|[+\-x/()]/g
  let last = 0
  let match
  while ((match = re.exec(text))) {
    if (match.index > last && text.slice(last, match.index).trim()) {
      return { ok: false, reason: 'char' }
    }
    const chunk = match[0]
    last = match.index + chunk.length
    if (/^\s+$/.test(chunk)) continue
    if (/^\d+$/.test(chunk)) tokens.push({ type: 'num', value: Number(chunk) })
    else if (OPS.includes(chunk)) tokens.push({ type: 'op', value: chunk })
    else if (chunk === '(') tokens.push({ type: 'lparen' })
    else if (chunk === ')') tokens.push({ type: 'rparen' })
  }
  if (text.slice(last).trim()) return { ok: false, reason: 'char' }
  return { ok: true, tokens }
}

export function tokensFromCells(cells) {
  const numberCells = cells.filter((cell) => cell.type === 'number')
  const idShift = Number(numberCells[0].id.match(/^n-(\d+)$/)[1])
  const lastFilled = [...numberCells].reverse().find((cell) => cell.value !== '')
  if (!lastFilled) {
    return { ok: false, reason: 'empty', complete: false }
  }

  const lastIndex = cells.findIndex((cell) => cell.id === lastFilled.id)
  const lastNumberPos = numberCells.findIndex((cell) => cell.id === lastFilled.id)

  for (let i = 0; i <= lastNumberPos; i += 1) {
    if (numberCells[i].value === '') {
      return { ok: false, reason: 'gap', complete: false }
    }
  }

  const range = cells.slice(0, lastIndex + 1)
  const trailing = cells.slice(lastIndex + 1)

  for (const cell of trailing) {
    if (cell.type === 'equals') break
    if (cell.type === 'op') {
      if (cell.value !== '') {
        return { ok: false, reason: 'ends-op', complete: false }
      }
      break
    }
    if (cell.type === 'number') break
    if (cell.type === 'right-bracket' && cell.value !== '') {
      range.push(cell)
    }
  }

  const firstNumber = numberCells[0]
  if (firstNumber.value === '') {
    return { ok: false, reason: 'start', complete: false }
  }

  for (let i = 0; i < lastNumberPos; i += 1) {
    const opCell = cells.find((cell) => cell.id === `op-${i + idShift}`)
    if (!opCell || opCell.value === '') {
      return { ok: false, reason: 'missing-op', complete: false }
    }
  }

  const tokens = []
  for (const cell of range) {
    if (cell.type === 'left-bracket' && cell.value) {
      tokens.push({ type: 'lparen' })
    } if (cell.type === 'right-bracket' && cell.value) {
      tokens.push({ type: 'rparen' })
    } else if (cell.type === 'number' && cell.value !== '') {
      tokens.push({ type: 'num', value: Number(cell.value) })
    } else if (cell.type === 'op' && cell.value !== '') {
      tokens.push({ type: 'op', value: cell.value })
    }
  }

  if (!tokens.length || tokens[0].type === 'op') {
    return { ok: false, reason: 'start', complete: false }
  }

  let depth = 0
  for (const token of tokens) {
    if (token.type === 'lparen') depth += 1
    if (token.type === 'rparen') depth -= 1
    if (depth < 0) return { ok: false, reason: 'parens', complete: false }
  }
  if (depth !== 0) return { ok: false, reason: 'parens', complete: false }

  if (tokens[tokens.length - 1].type !== 'num' && tokens[tokens.length - 1].type !== 'rparen') {
    return { ok: false, reason: 'ends-op', complete: false }
  }

  return { ok: true, tokens, complete: true }
}

function parseExpression(tokens) {
  let i = 0

  function peek() {
    return tokens[i]
  }

  function consume() {
    const token = tokens[i]
    i += 1
    return token
  }

  function parseFactor() {
    const token = peek()
    if (!token) return { ok: false, reason: 'eof' }
    if (token.type === 'num') {
      consume()
      return { ok: true, node: makeNumber(token.value) }
    }
    if (token.type === 'lparen') {
      consume()
      const inner = parseExpr()
      if (!inner.ok) return inner
      if (!peek() || peek().type !== 'rparen') return { ok: false, reason: 'parens' }
      consume()
      return { ok: true, node: makeGroup(inner.node, true) }
    }
    return { ok: false, reason: 'factor' }
  }

  function parseTerm() {
    let left = parseFactor()
    if (!left.ok) return left
    while (peek() && peek().type === 'op' && (peek().value === 'x' || peek().value === '/')) {
      const op = consume().value
      const right = parseFactor()
      if (!right.ok) return right
      left = { ok: true, node: makeBinary(left.node, op, right.node) }
    }
    return left
  }

  function parseExpr() {
    let left = parseTerm()
    if (!left.ok) return left
    while (peek() && peek().type === 'op' && (peek().value === '+' || peek().value === '-')) {
      const op = consume().value
      const right = parseTerm()
      if (!right.ok) return right
      left = { ok: true, node: makeBinary(left.node, op, right.node) }
    }
    return left
  }

  const parsed = parseExpr()
  if (!parsed.ok) return parsed
  if (i !== tokens.length) return { ok: false, reason: 'trailing' }
  return parsed
}

function evalNode(node, steps) {
  if (node.kind === 'number') {
    return { ok: true, value: node.value }
  }
  if (node.kind === 'group') {
    return evalNode(node.inner, steps)
  }
  const left = evalNode(node.left, steps)
  if (!left.ok) return left
  const right = evalNode(node.right, steps)
  if (!right.ok) return right
  const applied = applyOp(left.value, node.op, right.value)
  if (!applied.ok) return applied
  steps.push({
    expression: node.source,
    result: applied.value
  })
  return { ok: true, value: applied.value }
}

export function evaluateTokens(tokens) {
  const parsed = parseExpression(tokens)
  if (!parsed.ok) return { ok: false, reason: parsed.reason, steps: [] }
  const steps = []
  const evaluated = evalNode(parsed.node, steps)
  if (!evaluated.ok) return { ok: false, reason: evaluated.reason, steps }
  if (!Number.isInteger(evaluated.value)) {
    return { ok: false, reason: 'fraction', steps }
  }
  return {
    ok: true,
    value: evaluated.value,
    steps,
    source: parsed.node.source
  }
}

export function evaluateCells(cells) {
  const extracted = tokensFromCells(cells)
  if (!extracted.ok) {
    const subExpressions = findSubExpressions(cells)
    let steps = []
    for (let subExpression of subExpressions) {
      const extracted = tokensFromCells(subExpression)
      if (extracted.ok) {
        const evaluated = evaluateTokens(extracted.tokens)
        steps = [...steps, ...evaluated.steps]
      } else {
        const extracted = tokensFromCells(subExpression.slice(1, -1))
        if (extracted.ok) {
          const evaluated = evaluateTokens(extracted.tokens)
          steps = [...steps, ...evaluated.steps]
        }
      }
    }
    return { ok: false, reason: extracted.reason, complete: false, steps }
  }
  const evaluated = evaluateTokens(extracted.tokens)
  return { ...evaluated, complete: true }
}

export function findSubExpressions(cells) {
  let expressionStart = -1
  let expressionEnd = -1
  let subExpressions = []
  let i = 0
  while (true) {
    if (expressionStart < 0) {
      if (i + 6 >= cells.length - 1) {
        break
      }
      if (cells[i+1].value !== '' && cells[i+3].value !== '' && cells[i+5].value !== '') {
        expressionStart = i
        expressionEnd = i + 6
        i += 6
      } else {
        i += 4
      }
    } else {
      if (i + 4 >= cells.length - 1) {
        break
      }
      if (cells[i+1].value === '' || cells[i+3].value === '') {
        subExpressions.push(cells.slice(expressionStart, expressionEnd + 1))
        expressionStart = -1
        expressionEnd = -1
        i += 2
      } else {
        expressionEnd = i + 4
        i += 4
      }
    }
  }
  if (expressionStart > -1) {
    subExpressions.push(cells.slice(expressionStart, expressionEnd + 1))
  }
  return subExpressions
}

export function evaluateText(text) {
  const tokenized = tokenize(text)
  if (!tokenized.ok) return { ok: false, reason: tokenized.reason, steps: [] }
  return evaluateTokens(tokenized.tokens)
}

export function stepToCells(step) {
  const tokenized = tokenize(step.expression)
  if (!tokenized.ok) return []
  const cells = []
  let n = 0
  let o = 0
  let b = 0
  for (const token of tokenized.tokens) {
    if (token.type === 'num') {
      cells.push({
        id: `s-n-${n}`,
        type: 'number',
        value: String(token.value),
        interactive: false
      })
      n += 1
    } else if (token.type === 'op') {
      cells.push({
        id: `s-o-${o}`,
        type: 'op',
        value: token.value,
        interactive: false
      })
      o += 1
    } else if (token.type === 'lparen') {
      cells.push({
        id: `s-b-${b}`,
        type: 'left-bracket',
        value: '(',
        interactive: false
      })
      b += 1
    } else if (token.type === 'rparen') {
      cells.push({
        id: `s-b-${b}`,
        type: 'right-bracket',
        value: ')',
        interactive: false
      })
      b += 1
    }
  }
  cells.push({ id: 's-eq', type: 'equals', value: '=', interactive: false })
  cells.push({
    id: 's-res',
    type: 'result',
    value: String(Math.max(Math.min(step.result, 9999), -9999)),
    interactive: false
  })
  return cells
}

export function excludeBracketCells(cells) {
  const result = []
  for ( let i=0; i < cells.length; i++ ) {
    const steps = cells[i].slice(0)
    for ( let j=1; j < steps.length && steps.length > 1; j++ ) {
      if ( steps[j].type === "number" && steps[j-1].type === "left-bracket" ) {
        steps[j] = { ...steps[j], value: `${steps[j-1].value}${steps[j].value}` }
        steps.splice(j-1, 1)
        j--
      }
      if ( steps[j].type === "right-bracket" && steps[j-1].type === "number" ) {
        steps[j-1] = { ...steps[j-1], value: `${steps[j-1].value}${steps[j].value}` }
        steps.splice(j, 1)
        j--
      }
    }
    result.push(steps)
  }
  return result
}
