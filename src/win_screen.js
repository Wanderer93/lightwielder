import Phaser from 'phaser/dist/phaser.min.js'
import Controls from './controls.js'

export default class WinScreen extends Phaser.Scene {
  constructor () {
    super({ key: 'win_screen' })
  }

  create () {
    this.add.text(20, 20, 'Congratulations, you won!')
    this.add.text(20, 50, 'Press WASD to go to main menu')

    const keys = this.input.keyboard.addKeys('W,A,S,D,J')
    this.controls = new Controls(keys)
  }

  update (time, delta) {
    const anyPressed = this.controls.areAnyPressed()[0]
    if (anyPressed) {
      this.scene.start('start')
    }
  }
}
