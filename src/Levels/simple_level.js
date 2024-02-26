import Phaser from 'phaser/dist/phaser.min.js'

import Controls from '../controls.js'

import aTile from 'Assets/textures/tiles.png'
import Map from 'Assets/textures/test.json'
import PlayerImage from 'Assets/textures/flamey-fin.png'
import PlayerJSON from 'Assets/textures/flamey-fin.json'

import EnemyImage from 'Assets/textures/enemy.png'
import GoalImage from 'Assets/textures/goal.png'

const PLAYER_TEXTURE = 'player-texture'
const ENEMY_TEXTURE = 'enemy-texture'
const GOAL_TEXTURE = 'goal-texture'

const PIPELINE = 'Light2D'
const TILE_SIZE = 32
const TILE_SIZE_HALF = TILE_SIZE / 2
const LIGHT_DIAMETER = 160
const LIGHT_VARIATION_MAX_SIZE = 40
const PLAYER_SPEED = 128
const PLAYER_TICK_SPEED = 250 // milliseconds
const ENEMY_SPEED = 64
const ENEMY_TICK_SPEED = 500 // milliseconds

const directions = {
  LEFT: 'left',
  RIGHT: 'right',
  UP: 'up',
  DOWN: 'down'
}

export default class SimpleLevel extends Phaser.Scene {
  constructor () {
    super({ key: 'simple_level' })
  }

  preload () {
    this.load.tilemapTiledJSON('map', Map)
    this.load.image('tiles', aTile)

    this.load.aseprite(PLAYER_TEXTURE, PlayerImage, PlayerJSON)

    this.load.image(ENEMY_TEXTURE, EnemyImage)
    this.load.image(GOAL_TEXTURE, GoalImage)
  }

  create () {
    const map = this.make.tilemap({ key: 'map', tileWidth: TILE_SIZE, tileHeight: TILE_SIZE })
    const tileset = map.addTilesetImage('floating-tileset', 'tiles')
    this.isPlayerDying = false
    this.layerGround = map.createLayer('ground', tileset, 0, 0).setPipeline(PIPELINE)
    this.layerWater = map.createLayer('water', tileset, 0, 0).setPipeline(PIPELINE)
    this.layerHill = map.createLayer('hill', tileset, 0, 0).setPipeline(PIPELINE)
    this.layerBush = map.createLayer('bush', tileset, 0, 0).setPipeline(PIPELINE)

    for (const layer of [this.layerHill, this.layerBush, this.layerWater, this.layerGround]) {
      layer.setScale(2)
    }

    this.layerWater.setCollisionByExclusion([-1])
    this.layerBush.setCollisionByExclusion([-1])

    this.anims.createFromAseprite(PLAYER_TEXTURE)

    this.player = this.physics.add.sprite(TILE_SIZE, TILE_SIZE, PLAYER_TEXTURE).setPipeline(PIPELINE)
    this.player.play({ key: 'idle', repeat: -1 })

    this.player.setOrigin(0, 0)
    this.physics.add.collider(this.player, this.layerWater)
    this.physics.add.collider(this.player, this.layerBush)
    this.player.light = this.lights.addLight(TILE_SIZE + TILE_SIZE_HALF, TILE_SIZE + (TILE_SIZE + 2), LIGHT_DIAMETER).setColor(0xfb5236).setIntensity(2.0)
    this.lights.enable().setAmbientColor(0x000000)

    this.enemies = []
    this.enemies.push(this._createEnemy(10, 1, directions.LEFT, this))
    this.enemies.push(this._createEnemy(6, 10, directions.DOWN, this))
    this.enemies.push(this._createEnemy(5, 14, directions.DOWN, this))

    this.goal = this.physics.add.image(TILE_SIZE * 17, TILE_SIZE * 7, GOAL_TEXTURE).setPipeline('Light2D')
    this.goal.setOrigin(0, 0)
    this.physics.add.overlap(this.player, this.goal, this._goalOverlap, null, this)

    const keys = this.input.keyboard.addKeys('W,A,S,D,J')
    this.controls = new Controls(keys)
    this.lastMoveTime = 0
  }

  update (time, delta) {
    const [anyPressed, presses] = this.controls.areAnyPressed()
    const allowedToMove = time - this.lastMoveTime > PLAYER_TICK_SPEED
    const speed = PLAYER_SPEED
    const toggleWalk = () => {
      this.player.anims.play('walk')
    }
    if (allowedToMove) {
      // this.player.anims.play('walk')
      // This if block makes the player "snap" to the nearest tile. Without this,
      // there's no way of guaranteeing that the player won't overshoot by a
      // fraction of a pixel, which *looks* fine, but *technically* makes you
      // clash with a different tile.
      // Why yes, this bit was a complete arse, why do you ask?
      if (this.player.body.velocity.x || this.player.body.velocity.y) {
        const numX = this.player.body.x + TILE_SIZE_HALF
        const nearestX = numX - (numX % TILE_SIZE)
        const numY = this.player.body.y + TILE_SIZE_HALF
        const nearestY = numY - (numY % TILE_SIZE)
        this.player.body.setVelocity(0)
        this.player.play({ key: 'idle', repeat: -1 })
        this.player.body.reset(nearestX, nearestY)
      }

      if (anyPressed) {
        if (this.isPlayerDying) {
          return
        }
        if (presses.down || presses.up || presses.left || presses.right) {
          toggleWalk()
        }
        if (presses.down) {
          this.player.body.setVelocityY(speed)
        } else if (presses.up) {
          this.player.body.setVelocityY(-speed)
        } else if (presses.left) {
          this.player.body.setVelocityX(-speed)
        } else if (presses.right) {
          this.player.body.setVelocityX(speed)
        }
        this.lastMoveTime = time
      }
    }
    this.player.light.x = this.player.body.x + TILE_SIZE_HALF
    this.player.light.y = this.player.body.y + TILE_SIZE_HALF
    this.player.light.diameter = LIGHT_DIAMETER + Math.floor(Math.random() * LIGHT_VARIATION_MAX_SIZE)
    for (const enemy of this.enemies) {
      this._updateEnemy(enemy, time)
    }
  }

  _createEnemy (x, y, direction, scene) {
    const enemy = scene.physics.add.image(TILE_SIZE * x, TILE_SIZE * y, ENEMY_TEXTURE).setPipeline(PIPELINE)
    enemy.setOrigin(0, 0)
    enemy.direction = direction
    scene.physics.add.collider(enemy, scene.layerWater)
    scene.physics.add.collider(enemy, scene.layerBush)
    scene.physics.add.overlap(enemy, scene.player, scene._enemyOverlap, null, scene)
    enemy.lastMoveTime = 0
    return enemy
  }

  _enemyOverlap (enemy, player) {
    console.log('overlap!')
    this.isPlayerDying = true
    player.body.setVelocity(0, 0)
    player.body.stop()
    player.body.enable = false
    enemy.body.stop()
    enemy.body.enable = false
    const deathAnim = this.player.anims.play({ key: 'dead', repeat: 0 })
    deathAnim.timeScale = 0.01
    deathAnim.once('animationcomplete', () => {
      console.log('end game!')
      this.scene.start('game_over')
    })
  }

  _updateEnemy (enemy, time) {
    const moving = (enemy.body.velocity.x || enemy.body.velocity.y)

    const allowedToMove = time - enemy.lastMoveTime > ENEMY_TICK_SPEED
    const speed = ENEMY_SPEED

    if (allowedToMove) {
      // This if block makes the player "snap" to the nearest tile. Without this,
      // there's no way of guaranteeing that the player won't overshoot by a
      // fraction of a pixel, which *looks* fine, but *technically* makes you
      // clash with a different tile.
      // Why yes, this bit was a complete arse, why do you ask?
      if (moving) {
        const numX = enemy.body.x + TILE_SIZE_HALF
        const nearestX = numX - (numX % TILE_SIZE)
        const numY = enemy.body.y + TILE_SIZE_HALF
        const nearestY = numY - (numY % TILE_SIZE)
        enemy.body.x = nearestX
        enemy.body.y = nearestY
        enemy.lastMoveTime = time
      }
    }
    if (!moving) {
      switch (enemy.direction) {
        case directions.LEFT:
          enemy.direction = directions.RIGHT
          enemy.body.setVelocityX(speed)
          break
        case directions.RIGHT:
          enemy.direction = directions.LEFT
          enemy.body.setVelocityX(-speed)
          break
        case directions.UP:
          enemy.direction = directions.DOWN
          enemy.body.setVelocityY(speed)
          break
        case directions.DOWN:
          enemy.direction = directions.UP
          enemy.body.setVelocityY(-speed)
          break
      }
    }
  }

  _goalOverlap (player, goal) {
    this.scene.start('win_screen')
  }
}
