const STORAGE_ENTRY = "calc-game-save"

export function getDefaultData() {
  return {
    level: 1,
    score: 0,
    started: false,
    mode: "normal",
  }
}

export function loadData() {
  const mode = localStorage.getItem(STORAGE_ENTRY) ?? ""
  if (mode !== "normal" && mode !== "hard") {
    return getDefaultData()
  }
  try {
    const entry = atob(localStorage.getItem(`${STORAGE_ENTRY}-${mode}`) ?? "")
    if (!entry.length) {
      return { ...getDefaultData(), mode }
    }
    let data = JSON.parse(entry)
    return { ...data, mode }
  } catch (err) {
    return { ...getDefaultData(), mode }
  }
}

export function saveData(mode, data) {
  const entry = btoa(JSON.stringify(data))
  localStorage.setItem(`${STORAGE_ENTRY}-${mode}`, entry)
}

export function saveMode(mode) {
  localStorage.setItem(STORAGE_ENTRY, mode)
}