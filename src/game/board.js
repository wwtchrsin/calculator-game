export const NUMBER_COUNT = 6

export function createBoard(target) {
  const cells = []
  for (let i = 0; i < NUMBER_COUNT; i += 1) {
    cells.push({
      id: `bl-${i}`,
      type: 'bracket',
      value: '',
      interactive: true
    })
    cells.push({
      id: `n-${i}`,
      type: 'number',
      value: '',
      sourceId: null,
      interactive: true
    })
    cells.push({
      id: `br-${i}`,
      type: 'bracket',
      value: '',
      interactive: true
    })
    if (i < NUMBER_COUNT - 1) {
      cells.push({
        id: `op-${i}`,
        type: 'op',
        value: '',
        interactive: true
      })
    }
  }
  cells.push({ id: 'eq', type: 'equals', value: '=', interactive: false })
  cells.push({ id: 'pad-l', type: 'pad', value: '', interactive: false })
  cells.push({
    id: 'result',
    type: 'result',
    value: String(target),
    interactive: false
  })
  cells.push({ id: 'pad-r', type: 'pad', value: '', interactive: false })
  return cells
}

export function formatTime(totalSeconds) {
  const safe = Math.max(0, totalSeconds)
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
