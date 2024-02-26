import Phaser from 'phaser/dist/phaser.min.js'
import Controls from './controls.js'

export default class Start extends Phaser.Scene {
  constructor () {
    super({ key: 'start' })
  }

  create () {
    this.add.text(20, 20, 'Lightwielder')
    this.add.text(20, 50, 'A game for Indie Dev Jam 3')
    this.add.text(20, 80, 'by @Wanderer93 and @tarkadaal')
    this.add.text(20, 500, 'Press a WASD key to start.')
    this.add.text(20, 530, 'WASD keys move, J does something else...')

    const keys = this.input.keyboard.addKeys('W,A,S,D,J')
    this.controls = new Controls(keys)
  }

  update (time, delta) {
    const anyPressed = this.controls.areAnyPressed()[0]
    if (anyPressed) {
      this.scene.start('simple_level')
    }
  }
}
