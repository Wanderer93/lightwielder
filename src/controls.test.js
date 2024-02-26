const Controls = require('./controls')
function _testInputs (u, d, l, r, orm) {
  return {
    W: { isDown: u },
    S: { isDown: d },
    A: { isDown: l },
    D: { isDown: r },
    J: { isDown: orm }
  }
}

test('creation', () => {
  const c = new Controls()
  expect(c).toBeTruthy()
})

test('areAnyPressed, all false', () => {
  const c = new Controls(_testInputs(false, false, false, false, false))
  const [anyPressed, keys] = c.areAnyPressed()
  expect(anyPressed).toBe(false)
  expect(keys.up).toBe(false)
  expect(keys.down).toBe(false)
  expect(keys.left).toBe(false)
  expect(keys.right).toBe(false)
})

test('areAnyPressed, two true', () => {
  const c = new Controls(_testInputs(true, false, false, true, false))
  const [anyPressed, keys] = c.areAnyPressed()
  expect(anyPressed).toBe(true)
  expect(keys.up).toBe(true)
  expect(keys.down).toBe(false)
  expect(keys.left).toBe(false)
  expect(keys.right).toBe(true)
})

test('isOneRingMode', () => {
  const c = new Controls(_testInputs(false, false, false, false, true))
  const [anyPressed, keys] = c.areAnyPressed()
  expect(anyPressed).toBe(false)
  expect(keys.oneRingMode).toBe(true)
})
