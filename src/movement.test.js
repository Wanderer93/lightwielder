const movement = require('./movement')

test('synchronizes movement', () => {
  const source = { x: 7, y: 9 }
  const target = {}
  movement.synchronize(source, target)
  expect(source.x).toEqual(target.x)
  expect(source.y).toEqual(target.y)
})

test('synchronizes movement with offset', () => {
  const source = { x: 7, y: 9 }
  const target = {}
  const offset = -3
  movement.synchronize(source, target, offset)
  expect(target.x).toEqual(source.x + offset)
  expect(target.y).toEqual(source.y + offset)
})
