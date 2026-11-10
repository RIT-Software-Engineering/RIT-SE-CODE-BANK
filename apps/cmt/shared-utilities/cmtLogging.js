export function getTimeString() {
    const date = new Date()
    if (process.env.NODE_ENV === "development") return `${date.getMonth()}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    else return new Date().toISOString()
}