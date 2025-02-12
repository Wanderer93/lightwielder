import Phaser from 'phaser/dist/phaser.min.js'

import Controls from '../controls.js'

import aTile from 'Assets/textures/tiles.png'
import Map from 'Assets/textures/test-small.json'
import PlayerImage from 'Assets/textures/flamey-fin.png'
import PlayerJSON from 'Assets/textures/flamey-fin.json'

import EnemyImage from 'Assets/textures/monster-normal.png'
import EnemyJSON from 'Assets/textures/monster-normal.json'
import EnemyGrumpyImage from 'Assets/textures/monster-grumpy.png'
import EnemyGrumpyJSON from 'Assets/textures/monster-grumpy.json'
import GoalImage from 'Assets/textures/goal.png'
import MusicAsset from 'Assets/sounds/music/music.mp3'

const PLAYER_TEXTURE = 'player-texture'
const ENEMY_TEXTURE = 'enemy-texture'
const ENEMY_ORM_TEXTURE = 'enemy-orm-texture'
const GOAL_TEXTURE = 'goal-texture'
const MUSIC = 'music'

const PIPELINE = 'Light2D'
const TILE_SIZE = 48
const TILE_SIZE_HALF = TILE_SIZE / 2
const LIGHT_DIAMETER = 180
const LIGHT_VARIATION_MAX_SIZE = 40
const PLAYER_SPEED = 192
const PLAYER_TICK_SPEED = 250 // milliseconds
const ENEMY_SPEED = 96
const ENEMY_TICK_SPEED = 500 // milliseconds

const NORMAL_LIGHT_COLOR = 0xf2c13a
const ORM_MODE_LIGHT_COLOR = 0x6633DD

// If you want to debug enemy placement/map design,
// set this to 0xBBBBBB, so there is at least some
// ambient light.
const AMBIENT_COLOR = 0x000000

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
    this.load.aseprite(ENEMY_TEXTURE, EnemyImage, EnemyJSON)
    this.load.aseprite(ENEMY_ORM_TEXTURE, EnemyGrumpyImage, EnemyGrumpyJSON)

    this.load.image(GOAL_TEXTURE, GoalImage)

    this.load.audio(MUSIC, MusicAsset)
  }

  create () {
    this.backgroundMusic = this.sound.add('music')
    this.backgroundMusic.loop = true
    this.backgroundMusic.play()

    const map = this.make.tilemap({ key: 'map', tileWidth: TILE_SIZE, tileHeight: TILE_SIZE })
    const tileset = map.addTilesetImage('floating-tileset', 'tiles')
    this.isPlayerDying = false
    this.isORMon = false
    this.layerGround = map.createLayer('ground', tileset, 0, 0).setPipeline(PIPELINE)
    this.layerWater = map.createLayer('water', tileset, 0, 0).setPipeline(PIPELINE)
    this.layerHill = map.createLayer('hill', tileset, 0, 0).setPipeline(PIPELINE)
    this.layerBush = map.createLayer('bush', tileset, 0, 0).setPipeline(PIPELINE)

    for (const layer of [this.layerHill, this.layerBush, this.layerWater, this.layerGround]) {
      layer.x -= map.tileWidth * 3
      layer.y -= map.tileHeight * 3
      layer.setScale(3)
    }

    this.layerWater.setCollisionByExclusion([-1])
    this.layerBush.setCollisionByExclusion([-1])

    this.anims.createFromAseprite(PLAYER_TEXTURE)

    this.player = this.physics.add.sprite(TILE_SIZE, TILE_SIZE, PLAYER_TEXTURE).setPipeline(PIPELINE)
    this.player.play({ key: 'idle', repeat: -1 })
    this.player.setScale(1.5)

    this.player.setOrigin(0, 0)
    this.physics.add.collider(this.player, this.layerWater)
    this.physics.add.collider(this.player, this.layerBush)
    this.player.light = this.lights.addLight(
      TILE_SIZE + TILE_SIZE_HALF,
      TILE_SIZE + (TILE_SIZE + 2),
      LIGHT_DIAMETER).setColor(NORMAL_LIGHT_COLOR).setIntensity(1.0)
    this.lights.enable().setAmbientColor(AMBIENT_COLOR)

    this.enemies = []
    this.enemies.push(this._createEnemy(1, 3, directions.RIGHT, this))
    this.enemies.push(this._createEnemy(10, 1, directions.LEFT, this))
    this.enemies.push(this._createEnemy(6, 8, directions.RIGHT, this))
    this.enemies.push(this._createEnemy(5, 14, directions.DOWN, this))
    this.enemies.push(this._createEnemy(3, 14, directions.RIGHT, this))
    this.enemies.push(this._createEnemy(13, 8, directions.LEFT, this))
    this.enemies.push(this._createEnemy(13, 10, directions.RIGHT, this))

    this.goal = this.physics.add.image(TILE_SIZE * 14, TILE_SIZE * 4, GOAL_TEXTURE).setPipeline('Light2D')
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
      if (presses.oneRingMode !== this.oneRingMode) {
        if (presses.oneRingMode) {
          this.isORMon = true
          this.player.light.setColor(ORM_MODE_LIGHT_COLOR)
          this.goal.resetPipeline()
          for (const enemy of this.enemies) {
            enemy.resetPipeline()
            enemy.postFX.addGlow(ORM_MODE_LIGHT_COLOR, 6, 0, false, 0.1, 9)
            enemy.light.setVisible(true)
            enemy.setTexture(ENEMY_ORM_TEXTURE)
            this.anims.createFromAseprite(ENEMY_ORM_TEXTURE)
          }
        } else {
          this.isORMon = false
          this.player.light.setColor(NORMAL_LIGHT_COLOR)
          this.goal.setPipeline(PIPELINE)
          for (const enemy of this.enemies) {
            enemy.setPipeline(PIPELINE)
            enemy.postFX.clear()
            enemy.light.setVisible(false)
          }
        } this.oneRingMode = presses.oneRingMode
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
    const enemy = scene.physics.add.sprite(TILE_SIZE * x, TILE_SIZE * y, ENEMY_TEXTURE).setPipeline(PIPELINE)
    enemy.setScale(1.5)

    // const enemyGrumpy = scene.physics.add.sprite(TILE_SIZE * x, TILE_SIZE * y, ENEMY_ORM_TEXTURE).setPipeline(PIPELINE)
    // enemyGrumpy.setScale(1.5)

    this.anims.createFromAseprite(ENEMY_TEXTURE)

    enemy.setOrigin(0, 0)
    enemy.direction = direction
    scene.physics.add.collider(enemy, scene.layerWater)
    scene.physics.add.collider(enemy, scene.layerBush)
    scene.physics.add.overlap(enemy, scene.player, scene._enemyOverlap, null, scene)
    enemy.light = this.lights.addLight(
      TILE_SIZE * x + TILE_SIZE_HALF,
      TILE_SIZE * y + TILE_SIZE_HALF,
      LIGHT_DIAMETER)
      .setColor(ORM_MODE_LIGHT_COLOR)
      .setIntensity(1.0)
      .setVisible(false)

    enemy.lastMoveTime = 0
    for (const otherEnemy of scene.enemies) {
      scene.physics.add.collider(enemy, otherEnemy)
    }
    return enemy
  }

  _enemyOverlap (enemy, player) {
    this.isPlayerDying = true
    player.body.setVelocity(0, 0)
    player.body.stop()
    player.body.enable = false
    enemy.body.stop()
    enemy.body.enable = false
    const deathAnim = this.player.anims.play({ key: 'dead', repeat: 0 })
    deathAnim.timeScale = 0.01
    deathAnim.once('animationcomplete', () => {
      this.backgroundMusic.stop()
      this.backgroundMusic.play()
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
        (this.isORMon ? enemy.play('run-orm', true) : enemy.play('run', true))

        const numX = enemy.body.x + TILE_SIZE_HALF
        const nearestX = numX - (numX % TILE_SIZE)
        const numY = enemy.body.y + TILE_SIZE_HALF
        const nearestY = numY - (numY % TILE_SIZE)
        enemy.body.x = nearestX
        enemy.body.y = nearestY
        enemy.lastMoveTime = time

        if (this.oneRingMode) {
        // get enemy location
        // get player location
        // subtract enemy location from plyar's
          const xDiff = this.player.body.x - enemy.body.x
          const yDiff = this.player.body.y - enemy.body.y
          // which is bigger? (abs)
          const axisPriority = []
          if (Math.abs(xDiff) > Math.abs(yDiff)) {
            axisPriority.push(['x', xDiff, xDiff < 0 ? directions.LEFT : directions.RIGHT])
            axisPriority.push(['y', yDiff, yDiff < 0 ? directions.UP : directions.DOWN])
          } else {
            axisPriority.push(['y', yDiff, yDiff < 0 ? directions.UP : directions.DOWN])
            axisPriority.push(['x', xDiff, xDiff < 0 ? directions.LEFT : directions.RIGHT])
          }

          // The filter is to remove any commands with a value of 0;
          // without that line, you can get a silent(!) DBZ exception,
          // which makes the enemy disappear
          for (const [axis, value, direction] of axisPriority.filter((x) => x[1])) {
            const reduceValue = value / Math.abs(value)
            const worldX = axis === 'x' ? enemy.body.x + (reduceValue * TILE_SIZE) : enemy.body.x
            const worldY = axis === 'y' ? enemy.body.y + (reduceValue * TILE_SIZE) : enemy.body.y
            const waterTile = this.layerWater.getTileAtWorldXY(worldX, worldY)
            const bushTile = this.layerBush.getTileAtWorldXY(worldX, worldY)
            if ((waterTile && waterTile.canCollide) || (bushTile && bushTile.canCollide)) {
              continue
            } else {
              enemy.direction = direction

              enemy.body.setVelocityX(axis === 'x' ? reduceValue * speed : 0)
              enemy.body.setVelocityY(axis === 'y' ? reduceValue * speed : 0)
              break
            }
          }
        }
      }

      if (!moving) {
        (this.isORMon ? enemy.play('run-orm', false) : enemy.play('run', false))
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

    enemy.light.x = enemy.body.x + TILE_SIZE_HALF
    enemy.light.y = enemy.body.y + TILE_SIZE_HALF
    enemy.light.diameter = LIGHT_DIAMETER + Math.floor(Math.random() * LIGHT_VARIATION_MAX_SIZE)
  }

  _goalOverlap (player, goal) {
    this.scene.start('win_screen')
  }
}
