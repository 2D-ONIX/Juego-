// URL to explain PHASER scene: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scene/

export default class Juego extends Phaser.Scene {
  constructor() {
    super("hello-world");
  }

  init() {
    // ...
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

  preload() {
    this.load.image('mybullet', 'public/assets/images/mybullet.png');
    this.load.image('enemybullet', 'public/assets/images/enemybullet.png');
    this.load.image('ship', 'public/assets/images/ship.png');
    this.load.image('enemy', 'public/assets/images/enemy.png');
    this.load.image('asteroid', 'assets/games/asteroids/asteroid.png');
  }

  create() {
    this.sprite = this.physics.add.image(400, 300, 'ship');

    this.sprite.setDamping(true);
    this.sprite.setDrag(0.99);
    this.sprite.setMaxVelocity(200);

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
    this.enemyTimer = this.time.addEvent({ delay: 10000, callback: this.spawnEnemy, callbackScope: this, repeat: 9 });

    this.time.addEvent({ delay: 5000, callback: this.enemyShoot, callbackScope: this, loop: true });

    this.physics.add.collider(this.bullets, this.enemies, this.hitEnemy, this.checkPlayerBulletCollision, this);
    this.physics.add.collider(this.bullets, this.asteroids, this.hitAsteroid, null, this);
    this.physics.add.collider(this.enemies, this.sprite, this.hitEnemyPlayer, null, this);
    this.physics.add.collider(this.asteroids, this.sprite, this.hitAsteroidPlayer, null, this);
    this.physics.add.collider(this.sprite, this.bullets, this.hitPlayerBullet, this.checkEnemyBulletCollision, this);

    this.physics.world.setBoundsCollision(true, true, true, true);
  }

  update() {
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

  spawnEnemy() {
    if (this.enemyCount < 10) {
      const enemy = this.physics.add.sprite(Phaser.Math.Between(100, 700), Phaser.Math.Between(100, 500), 'enemy');
      this.enemies.add(enemy);
      this.enemyCount++;

      const randomAngle = Phaser.Math.FloatBetween(-Math.PI, Math.PI);
      enemy.rotation = randomAngle;
    }
  }

  enemyMove(enemy) {
    this.physics.velocityFromRotation(enemy.rotation, 100, enemy.body.velocity);
  }

  enemyShoot() {
    this.enemies.children.each((enemy) => {
      if (!enemy.getData('isDestroyed')) {
        const bullet = this.bullets.create(enemy.x, enemy.y, 'enemybullet');
        bullet.rotation = this.physics.accelerateToObject(bullet, this.sprite, 100);
        this.physics.velocityFromRotation(bullet.rotation, 200, bullet.body.velocity);
      }
    });
  }

  playerShoot() {
    const bullet = this.bullets.create(this.sprite.x, this.sprite.y, 'mybullet');
    bullet.rotation = this.sprite.rotation;
    this.physics.velocityFromRotation(bullet.rotation, 200, bullet.body.velocity);
  }

  hitEnemy(bullet, enemy) {
    bullet.disableBody(true, true);
    enemy.disableBody(true, true);
    enemy.setData('isDestroyed', true);
    this.enemyCount++;
    this.points += 50;
    this.pointsText.setText(`Points: ${this.points}`);

    if (this.enemyCount === 0) {
      this.enemyTimer.paused = true;
    }
  }

  hitEnemyPlayer(player, enemy) {
    enemy.disableBody(true, true);
    this.lives--;
    this.livesText.setText(`Lives: ${this.lives}`);

    if (this.lives <= 0) {
      this.playerDestroyed();
    }
  }

  hitAsteroid(asteroid, bullet) {
    bullet.disableBody(true, true);
    asteroid.disableBody(true, true);
    this.points += 20;
    this.pointsText.setText(`Points: ${this.points}`);
  }

  hitAsteroidPlayer(asteroid, player) {
    asteroid.disableBody(true, true);
    this.lives--;
    this.livesText.setText(`Lives: ${this.lives}`);

    if (this.lives <= 0) {
      this.playerDestroyed();
    }
  }

  hitPlayerBullet(player, bullet) {
    bullet.disableBody(true, true);
    this.lives--;
    this.livesText.setText(`Lives: ${this.lives}`);

    if (this.lives <= 0) {
      this.playerDestroyed();
    }
  }

  checkPlayerBulletCollision(bullet, enemy) {
    return bullet.texture.key === 'mybullet';
  }

  checkEnemyBulletCollision(player, bullet) {
    return bullet.texture.key === 'enemybullet';
  }

  playerDestroyed() {
    this.sprite.disableBody(true, true);
    this.livesText.setText('Game Over');
    this.time.addEvent({ delay: 3000, callback: this.restartGame, callbackScope: this });
  }

  restartGame() {
    this.scene.restart();
  }
}




