// URL to explain PHASER scene: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scene/

export default class Juego extends Phaser.Scene {
  constructor() {
    super("hello-world");
  }

  text;
  cursors;
  sprite;
  enemies;
  bullets;
  lives;
  livesText;
  points;
  pointsText;
  enemyCount;
  enemyTimer;
  spaceKey;
  asteroids;
  activeEnemiesText;
  gameOverText;
  restartText;

  preload() {
    this.load.image('mybullet', 'public/assets/images/mybullet.png');
    this.load.image('enemybullet', 'public/assets/images/enemybullet.png');
    this.load.image('ship', 'public/assets/images/ship.png');
    this.load.image('enemy', 'public/assets/images/enemy.png');
    this.load.image('asteroid', 'public/assets/images/asteroid.png');
    this.load.audio('laserSound', 'public/assets/Sounds/laser.mp3');
    this.load.audio('bombSound', 'public/assets/Sounds/bomb.mp3');
    this.load.audio('winSound', 'public/assets/Sounds/win_loud.mp3');
    this.load.audio('laserEnemy', 'public/assets/Sounds/laserenemy.mp3');
    this.load.audio('music', 'public/assets/Sounds/music.mp3');
  }

  create() {
    this.sprite = this.physics.add.image(400, 300, 'ship');

    this.sprite.setDamping(true);
    this.sprite.setDrag(0.99);
    this.sprite.setMaxVelocity(200);

    this.laserSound = this.sound.add('laserSound');
    this.bombSound = this.sound.add('bombSound');
    this.winSound = this.sound.add('winSound');
    this.laserEnemy = this.sound.add('laserEnemy');

    this.music = this.sound.add('music', { loop: true });
    this.music.play();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.text = this.add.text(10, 10, '', { font: '16px Courier', fill: '#00ff00' });
    this.lives = 3;
    this.livesText = this.add.text(10, 40, 'Lives: 3', { font: '16px Courier', fill: '#ff0000' });
    this.points = 0;
    this.pointsText = this.add.text(10, 70, 'Points: 0', { font: '16px Courier', fill: '#ffffff' });

    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.asteroids = this.physics.add.group();

    this.enemyCount = 0;
    this.destroyedEnemies = [];
    this.enemyTimer = this.time.addEvent({ delay: 10000, callback: this.spawnEnemy, callbackScope: this, repeat: 9 });
    this.time.addEvent({ delay: 5000, callback: this.spawnAsteroid, callbackScope: this, loop: true });
    

    this.physics.add.collider(this.bullets, this.enemies, this.hitEnemy, this.checkPlayerBulletCollision, this);
    this.physics.add.collider(this.bullets, this.asteroids, this.hitAsteroid, this.checkPlayerBulletCollision, this);
    this.physics.add.collider(this.enemies, this.sprite, this.hitEnemyPlayer, null, this);
    this.physics.add.collider(this.asteroids, this.sprite, this.hitAsteroidPlayer, null, this);
    this.physics.add.collider(this.sprite, this.bullets, this.hitPlayerBullet, this.checkEnemyBulletCollision, this);

    this.physics.world.setBoundsCollision(true, true, true, true);

    this.gameOverText = this.add.text(400, 300, 'Game Over', { font: '48px Arial', fill: '#ff0000', align: 'center' });
    this.gameOverText.setOrigin(0.5);
    this.gameOverText.setVisible(false);

    this.restartText = this.add.text(400, 400, 'Press R to Restart', { font: '24px Arial', fill: '#ffffff', align: 'center' });
    this.restartText.setOrigin(0.5);
    this.restartText.setVisible(false);

    this.input.keyboard.on('keydown-R', () => {
      this.scene.restart();
    });
  }

  update() {
    if (!this.sprite.getData('isDestroyed')) {
      if (this.cursors.up.isDown) {
        this.physics.velocityFromRotation(this.sprite.rotation, 200, this.sprite.body.acceleration);
      } else {
        this.sprite.setAcceleration(0);
      }

      if (this.cursors.left.isDown) {
        this.sprite.setAngularVelocity(-300);
      } else if (this.cursors.right.isDown) {
        this.sprite.setAngularVelocity(300);
      } else {
        this.sprite.setAngularVelocity(0);
      }

      this.text.setText(`Speed: ${this.sprite.body.speed}`);

      this.physics.world.wrap(this.sprite, 32);

      this.enemies.children.each((enemy) => {
        this.enemyMove(enemy);
        this.physics.world.wrap(enemy, 16);
      });

      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.playerShoot();
      }
    }
  }

  spawnEnemy() {
    if (!this.gameOverText.visible && this.enemyCount < 10) {
      const enemy = this.enemies.create(Phaser.Math.Between(100, 700), -20, 'enemy');
      enemy.setData('isDestroyed', false);
  
      const randomAngle = Phaser.Math.FloatBetween(-Math.PI, Math.PI);
      enemy.rotation = randomAngle;
  
      // Configurar evento de tiempo para el disparo del enemigo
      const shootEvent = this.time.addEvent({
        delay: Phaser.Math.Between(2000, 4000),
        callback: () => {
          if (!enemy.getData('isDestroyed')) {
            const bullet = this.bullets.create(enemy.x, enemy.y, 'enemybullet');
            bullet.rotation = this.physics.accelerateToObject(bullet, this.sprite, 100);
            this.physics.velocityFromRotation(bullet.rotation, 200, bullet.body.velocity);
          }
        },
        callbackScope: this,
        loop: true
      });
  
      // Asignar el evento de tiempo al enemigo
      enemy.setData('shootEvent', shootEvent);
  
      this.enemyCount++;
    }
  }

  spawnAsteroid() {
    if (!this.gameOverText.visible) {
      const x = Math.random() < 0.5 ? -20 : 820;
      const y = Phaser.Math.Between(100, 500);
      const asteroid = this.physics.add.sprite(x, y, 'asteroid');
      this.asteroids.add(asteroid);

      const velocity = Phaser.Math.Between(50, 150);
      if (x === -20) {
        asteroid.setVelocityX(velocity);
      } else {
        asteroid.setVelocityX(-velocity);
      }

      this.time.addEvent({
        delay: Phaser.Math.Between(2000, 4000),
        callback: () => {
          if (x === -20) {
            asteroid.setVelocityX(velocity);
          } else {
            asteroid.setVelocityX(-velocity);
          }
        },
        callbackScope: this
      });
    }
  }

  enemyMove(enemy) {
    this.physics.velocityFromRotation(enemy.rotation, 100, enemy.body.velocity);
  }

  enemyShoot() {
    if (!this.gameOverText.visible) {
      this.enemies.children.each((enemy) => {
        if (!enemy.getData('isDestroyed')) {
          const bullet = this.bullets.create(enemy.x, enemy.y, 'enemybullet');
          bullet.rotation = this.physics.accelerateToObject(bullet, this.sprite, 100);
          this.physics.velocityFromRotation(bullet.rotation, 200, bullet.body.velocity);
        }
      });
    }

    this.laserEnemy.play();
  }

  playerShoot() {
    if (!this.gameOverText.visible) {
      const bullet = this.bullets.create(this.sprite.x, this.sprite.y, 'mybullet');
      bullet.rotation = this.sprite.rotation;
      this.physics.velocityFromRotation(bullet.rotation, 200, bullet.body.velocity);
      bullet.setData('isPlayerBullet', true); // Asignar la propiedad 'isPlayerBullet' a true
    }

    if (!this.gameOverText.visible) {
      const bullet = this.bullets.create(this.sprite.x, this.sprite.y, 'mybullet');
      bullet.rotation = this.sprite.rotation;
      this.physics.velocityFromRotation(bullet.rotation, 200, bullet.body.velocity);
      bullet.setData('isPlayerBullet', true); // Asignar la propiedad 'isPlayerBullet' a true
  
      this.laserSound.play(); // Reproducir el sonido "laser"
    }
  }

  hitEnemy(bullet, enemy) {
    bullet.disableBody(true, true);
    enemy.disableBody(true, true);
    enemy.setData('isDestroyed', true);
    this.enemyCount--;
    this.points += 50;
    this.pointsText.setText(`Points: ${this.points}`);
  
    if (this.enemyCount === 0) {
      this.enemyTimer.paused = true;
    }
  
    this.bombSound.play(); // Reproducir el sonido "bomb"
  
    // Desactivar disparos del enemigo destruido
    enemy.getData('shootEvent').remove(false);
  
    // Reaparecer el enemigo después de un retraso
    this.time.addEvent({
      delay: Phaser.Math.Between(5000, 10000),
      callback: () => {
        enemy.enableBody(true, enemy.x, -20, true, true);
        enemy.setData('isDestroyed', false);
        this.enemyCount++;
        this.enemyTimer.paused = false;
      },
      callbackScope: this
    });
  }
  

  hitAsteroid(bullet, asteroid) {
    bullet.disableBody(true, true);
    asteroid.disableBody(true, true);
    this.points += 5;
    this.pointsText.setText(`Points: ${this.points}`);

    this.bombSound.play(); // Reproducir el sonido "bomb"
  }

  hitEnemyPlayer(player, enemy) {
    if (!this.sprite.getData('isDestroyed')) {
      enemy.disableBody(true, true);
      this.lives--;
      this.livesText.setText(`Lives: ${this.lives}`);
  
      if (this.lives <= 0) {
        this.playerDestroyed();
      } else {
        this.sprite.setData('isDestroyed', true);
        this.sprite.setAlpha(0.5);
  
        this.time.addEvent({
          delay: 3000,
          callback: () => {
            this.sprite.setData('isDestroyed', false);
            this.sprite.setAlpha(1);
          },
          callbackScope: this
        });
      }
    }

    this.bombSound.play(); // Reproducir el sonido "bomb"
  }

  hitAsteroidPlayer(player, asteroid) {
    if (!player.getData('isDestroyed')) {
      asteroid.disableBody(true, true);
      player.setData('isDestroyed', true);
      player.disableBody(true, true);
      this.lives--;
      this.livesText.setText(`Lives: ${this.lives}`);

      if (this.lives === 0) {
        this.gameOver();
      } else {
        this.time.delayedCall(1000, this.resetPlayer, [], this);
      }
    }
    this.bombSound.play(); // Reproducir el sonido "bomb"
  }

  hitPlayerBullet(player, bullet) {
    if (!player.getData('isDestroyed') && !bullet.getData('isPlayerBullet')) { // Comprobar que la bala no sea del jugador
      bullet.disableBody(true, true);
      player.setData('isDestroyed', true);
      player.disableBody(true, true);
      this.lives--;
      this.livesText.setText(`Lives: ${this.lives}`);

      if (this.lives === 0) {
        this.gameOver();
      } else {
        this.time.delayedCall(1000, this.resetPlayer, [], this);
      }
    }

    this.bombSound.play(); // Reproducir el sonido "bomb"
  }

  checkPlayerBulletCollision(bullet, enemy) {
    return bullet.getData('isPlayerBullet'); // Comprobar si la bala es del jugador
  }

  checkEnemyBulletCollision(player, bullet) {
    return bullet.getData('isPlayerBullet'); // Comprobar si la bala es del jugador
  }

  gameOver() {
    this.gameOverText.setVisible(true);
    this.restartText.setVisible(true);
    this.bullets.clear(true, true);
    this.enemies.children.each((enemy) => {
      enemy.disableBody(true, true);
    });
    this.asteroids.children.each((asteroid) => {
      asteroid.disableBody(true, true);
    });

    this.destroyedEnemies.forEach((enemy) => {
      enemy.destroy();
    });
    this.destroyedEnemies = [];

    this.winSound.play();
    this.music.stop();
  }

  resetPlayer() {
    this.sprite.enableBody(true, this.sprite.x, this.sprite.y, true, true);
    this.sprite.setAcceleration(0);
    this.sprite.setVelocity(0, 0);
    this.sprite.setRotation(0);
    this.sprite.setData('isDestroyed', false);
  }
}
