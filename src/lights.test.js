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
