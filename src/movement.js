function synchronize (source, target, offset = 0) {
  target.x = source.x + offset
  target.y = source.y + offset
}

module.exports = { synchronize }
