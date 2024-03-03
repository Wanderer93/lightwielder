class Lights {
  constructor (controller, getRandomNumber = Math.random) {
    this._controller = controller
    this._getRandomNumber = getRandomNumber
  }

  flicker (light, diameter, maxVariation) {
    light.diameter = diameter + Math.floor(this._getRandomNumber() * maxVariation)
  }

  setColor (light, color) {
    light.setColor(color)
  }
}

module.exports = Lights
