const Lights = require('./lights')

function _fakeController () {
  return {}
}

test('creation', () => {
  const l = new Lights(_fakeController())
  expect(l).toBeTruthy()
})

test('flicker', () => {
  const l = new Lights(_fakeController(), () => 0.5)
  const diameter = 100
  const maxVariation = 10
  const actor = {}
  l.flicker(actor, diameter, maxVariation)
  expect(actor.diameter).toEqual(105)
})

test('setColor', () => {
  const l = new Lights(_fakeController())
  const color = 0xBAEBAE
  const actor = {
    color: 0,
    setColor: function (x) { this.color = x }
  }
  l.setColor(actor, color)
  expect(actor.color).toEqual(color)
})
