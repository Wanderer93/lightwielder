import Phaser from 'phaser/dist/phaser.min.js'
import SimpleLevel from './Levels/simple_level.js'
import Start from './start.js'
import GameOver from './game_over.js'
import WinScreen from './win_screen.js'

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'game_drop',
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600
  },
  scene: [Start, SimpleLevel, GameOver, WinScreen],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }
    }
  }
}

const game = new Phaser.Game(config) // eslint-disable-line no-unused-vars
