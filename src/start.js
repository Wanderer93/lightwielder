import Phaser from 'phaser/dist/phaser.min.js'
import Controls from './controls.js'

export default class Start extends Phaser.Scene {
  constructor () {
    super({ key: 'start' })
  }

  preload () {
    // this.load.add('Celtic Bit', '../assets/fonts/celtic-bit.ttf')
  }

  create () {
    this.add.text(100, 100, 'Hello, Phaser 3!', {
      fontFamily: 'Celtic Bit',
      fontSize: '32px',
      fill: '#ffffff'
    })
    this.add.text(20, 20, 'Lightwielder')
    this.add.text(20, 50, 'A game for Indie Dev Jam 3')
    this.add.text(20, 80, 'by @Wanderer93 and @tarkadaal')
    this.add.text(20, 550, 'Press a WASD key to start.')

    const keys = this.input.keyboard.addKeys('W,A,S,D')
    this.controls = new Controls(keys)
  }

  update (time, delta) {
    const anyPressed = this.controls.areAnyPressed()[0]
    if (anyPressed) {
      this.scene.start('simple_level')
    }
  }
}
