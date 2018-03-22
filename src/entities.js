/////////////// BEGIN PLAYER RELATED ENTITIES ///////////////
const Beer = function(x, y, vx) {
  this.setup('BEER', { vx: -vx });
  this.x = x;
  this.y = y;

  this.reset = function() {
    this.board.remove(this);
  };
};

Beer.prototype = new Sprite();
Beer.prototype.type = OBJECT_PLAYER_PROJECTILE;

Beer.prototype.step = function(dt) {
  this.x += this.vx * dt;
};

/**
 * This player moves or throws beer for every click.
 * Long key press won't have any effect
 */
const Player = function() {
  this.setup('PLAYER', {
    fixedPos: [
      { x: 325, y: 90 },
      { x: 357, y: 185 },
      { x: 389, y: 281 },
      { x: 421, y: 377 },
    ],
    initialPos: 3,
    currentPos: this.initialPos,
    beer: new Beer(0, 0, 0),
  });

  this.reset = function() {
    this.currentPos = this.initialPos;

    this.x = this.fixedPos[this.currentPos].x;
    this.y = this.fixedPos[this.currentPos].y;
  };
  this.reset();

  let freeUp = false; // Control over key 'up' press
  let freeDown = false; // Control over key 'down' press
  let freeSpace = false; // Control over key 'space' press

  this.step = function() {
    if (!Game.keys['up']) freeUp = true;
    if (!Game.keys['down']) freeDown = true;
    if (!Game.keys['space']) freeSpace = true;

    if (freeUp && Game.keys['up']) {
      freeUp = false;
      this.currentPos =
        this.currentPos == 0 ? this.fixedPos.length - 1 : --this.currentPos;
    } else if (freeDown && Game.keys['down']) {
      freeDown = false;
      this.currentPos = ++this.currentPos % this.fixedPos.length;
    } else if (freeSpace && Game.keys['space']) {
      freeSpace = false;
      GameManager.notifyBeer();
      this.board.add(
        Object.create(this.beer, {
          x: {
            value: this.x - Sprites.BEER.w,
            enumerable: true,
            writable: true,
          },
          y: {
            value: this.y,
            enumerable: true,
            writable: true,
          },
          vx: {
            value: -200,
            enumerable: true,
          },
        })
      );
    }

    this.x = this.fixedPos[this.currentPos].x;
    this.y = this.fixedPos[this.currentPos].y;
  };
};

Player.prototype = new Sprite();
Player.prototype.type = OBJECT_PLAYER;

/**
 * This player moves or throws beer for every reload tick.
 * Long key press will trigger multiple actions.
 */
const Player2 = function() {
  this.setup('PLAYER', {
    fixedPos: [
      { x: 325, y: 90 },
      { x: 357, y: 185 },
      { x: 389, y: 281 },
      { x: 421, y: 377 },
    ],
    initialPos: 3,
    currentPos: initialPos,
    beer: new Beer(0, 0, 0),
    reloadTime: 0.25,
    restTime: 0.5,
  });

  this.reset = function() {
    this.currentPos = this.initialPos;

    this.reload = this.reloadTime;
    this.rest = this.restTime;
    this.x = this.fixedPos[this.currentPos].x;
    this.y = this.fixedPos[this.currentPos].y;
  };
  this.reset();

  this.step = function(dt) {
    this.rest -= dt;
    if (Game.keys['up'] && this.rest < 0) {
      Game.keys['up'] = false;
      this.rest = this.restTime;
      this.currentPos =
        this.currentPos == 0 ? this.fixedPos.length - 1 : --this.currentPos;
    } else if (Game.keys['down'] && this.rest < 0) {
      Game.keys['down'] = false;
      this.rest = this.restTime;
      this.currentPos = ++this.currentPos % this.fixedPos.length;
    }

    this.x = this.fixedpPos[this.currentPos].x;
    this.y = this.fixedPos[this.currentPos].y;

    this.reload -= dt;
    if (Game.keys['space'] && this.reload < 0) {
      Game.keys['space'] = false;
      GameManager.notifyBeer();
      this.reload = this.reloadTime;

      this.board.add(
        Object.create(this.beer, {
          x: {
            value: this.x - Sprites.BEER.w,
            enumerable: true,
            writable: true,
          },
          y: {
            value: this.y,
            enumerable: true,
            writable: true,
          },
          vx: {
            value: -200,
            enumerable: true,
          },
        })
      );
    }
  };
};

Player2.prototype = new Sprite();
Player2.prototype.type = OBJECT_PLAYER;
/////////////// END PLAYER RELATED ENTITIES ///////////////

/////////////// BEGIN NPC RELATED ENTITIES ///////////////
const Glass = function(x, y, vx) {
  this.setup('GLASS');
  this.x = x;
  this.y = y;
  this.vx = vx;

  this.reset = function() {
    this.board.remove(this);
  };
};

Glass.prototype = new Sprite();
Glass.prototype.type = OBJECT_CLIENT_PROJECTILE;

Glass.prototype.step = function(dt) {
  this.x += this.vx * dt;

  const collision = this.board.collide(this, OBJECT_PLAYER);
  if (collision) {
    this.board.remove(this);
    GameManager.notifyServed();
  }
};

const Client = function(x, y, vx, sprite) {
  this.setup(sprite, { reloadTime: 0.25 });
  this.x = x;
  this.y = y;
  this.vx = vx;

  this.reset = function() {
    this.board.remove(this);
  };
};

Client.prototype = new Sprite();
Client.prototype.type = OBJECT_CLIENT;

Client.prototype.step = function(dt) {
  this.x += this.vx * dt;

  const collision = this.board.collide(this, OBJECT_PLAYER_PROJECTILE);
  if (collision) {
    collision.hit(this);
    this.board.add(new Glass(this.x, this.y + 10, 200));
    this.board.remove(this);

    GameManager.notifyGlass();
  }
};
/////////////// END NPC RELATED ENTITIES ///////////////

/////////////// BEGIN GAME RELATED ENTITIES ///////////////
const Background = function() {
  this.setup('BACKGROUND');
  this.x = 0;
  this.y = 0;

  this.step = function() {};

  this.reset = function() {};
};

Background.prototype = new Sprite();

const Leftwall = function() {
  this.setup('LEFT_WALL');
  this.x = 0;
  this.y = 0;

  this.step = function() {};

  this.reset = function() {};
};

Leftwall.prototype = new Sprite();

const DeadZone = function(x, y) {
  this.x = x;
  this.y = y;
  this.w = 10;
  this.h = 80;
  this.type = OBJECT_DEADZONE;

  this.step = function() {
    const collision = this.board.collide(
      this,
      OBJECT_CLIENT | OBJECT_PLAYER_PROJECTILE | OBJECT_CLIENT_PROJECTILE
    );

    if (collision) {
      collision.hit(this);

      GameManager.notifyDead();
    }
  };

  this.draw = function() {
    Game.ctx.fillStyle = '#5e7be3';
    Game.ctx.fillRect(this.x, this.y, this.w, this.h);
  };

  this.reset = function() {};
};
/////////////// END GAME RELATED ENTITIES ///////////////
