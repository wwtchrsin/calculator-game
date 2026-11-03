const STORAGE_ENTRY = "calc-game-save"

export function getDefaultData() {
  return {
    level: 1,
    score: 0,
    started: false,
  }
}

export function loadData() {
  try {
    const entry = atob(localStorage.getItem(STORAGE_ENTRY) ?? "")
    if (!entry.length) {
      return getDefaultData()
    }
    let data = JSON.parse(entry)
    return data
  } catch (err) {
    return getDefaultData()
  }
}

export function saveData(data) {
  const entry = btoa(JSON.stringify(data))
  localStorage.setItem(STORAGE_ENTRY, entry)
}