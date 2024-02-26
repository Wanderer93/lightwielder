class Controls {
  constructor (keys) {
    this.keys = keys
  }

  // These methods "consume" the keystroke from the underlying Phaser keys
  // object. Calling areAnyPressed creates a snapshot, which you can then
  // query non-destructively.
  isUpPressed () {
    return this.keys.W.isDown
  }

  isDownPressed () {
    return this.keys.S.isDown
  }

  isLeftPressed () {
    return this.keys.A.isDown
  }

  isRightPressed () {
    return this.keys.D.isDown
  }

  isOneRingModePressed () { return this.keys.J.isDown }

  areAnyPressed () {
    const snapshot = {
      up: this.isUpPressed(),
      down: this.isDownPressed(),
      left: this.isLeftPressed(),
      right: this.isRightPressed(),
      oneRingMode: this.isOneRingModePressed()
    }
    return [snapshot.up || snapshot.down || snapshot.left || snapshot.right, snapshot]
  }
}

module.exports = Controls
