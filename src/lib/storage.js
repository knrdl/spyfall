export function retrieveData(key, fallback = undefined) {
    const data = localStorage.getItem(key)
    if (data === null) return fallback
    else return JSON.parse(data)
}

export function storeData(key, data) {
    localStorage.setItem(key, JSON.stringify(data))
}