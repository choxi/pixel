export default class Debugger {
  static copy(object, level=0) {
    if (level > 3) {
      return null
    }

    const newObj = {}

    Object.keys(object).forEach(key => {
      const value = object[key]

      if (key === "p5") {
        return
      }

      if (value && typeof value === "object") {
        newObj[key] = Debugger.copy(value, level + 1)
      } else {
        newObj[key] = value
      }
    })

    return newObj
  }
}