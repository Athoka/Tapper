const sprites = {
  Background: { sx: 0, sy: 480, w: 512, h: 480, frames: 1 },
  Player: { sx: 512, sy: 0, w: 56, h: 66, frames: 1},
  NPC: { sx: 512, sy: 66, w: 33, h: 33, frames: 1},
  Beer: { sx: 512, sy: 99, w: 23, h: 32, frames: 1},
  Glass: { sx: 512, sy: 131, w: 23, h: 32, frames: 1},
  LeftWall: { sx: 0, sy: 0, w: 512, h: 480, frames: 1}
};

const OBJECT_PLAYER = 1;
const OBJECT_PLAYER_PROJECTILE = 2;
const OBJECT_CLIENT = 4;
const OBJECT_CLIENT_PROJECTILE = 8;
const OBJECT_DEADZONE = 16;

const clientsfixedpos = [
  {x: 110, y: 80},
  {x: 78, y: 175},
  {x: 46, y: 271},
  {x: 14, y: 367}
]

const startGame = function() {
  const ua = navigator.userAgent.toLowerCase();

  Game.setBoard(0,
    new TitleScreen("Tapper", "Press space to start playing", playGame)
  );
};

const playGame = function() {
  GameManager.reset();

  const backboard = new GameBoard();
  backboard.add(new Background());
  Game.setBoard(0, backboard);

  const board = new GameBoard();
  // rigth side
  board.add(new DeadZone(335, 90));
  board.add(new DeadZone(367, 185));
  board.add(new DeadZone(399, 281));
  board.add(new DeadZone(431, 377));
  // left side
  board.add(new DeadZone(100, 80));
  board.add(new DeadZone(68, 175));
  board.add(new DeadZone(36, 271));
  board.add(new DeadZone(4, 367));

  board.add(new Player());
  for (let x = 0; x < 1; x++) {
    const r = 2;
    board.add(new Spawner(clientsfixedpos[x], 1, 'NPC', 1 + r * x));
  }
  Game.setBoard(1, board);

  const frontboard = new GameBoard();
  frontboard.add(new Leftwall());
  // left side
  frontboard.add(new DeadZone(100, 80));
  frontboard.add(new DeadZone(68, 175));
  frontboard.add(new DeadZone(36, 271));
  frontboard.add(new DeadZone(4, 367));
  Game.setBoard(2, frontboard);
};

const winGame = function() {
  Game.setBoard(3,
    new TitleScreen("You win!", "Press space to play again", playGame)
  );
};

const loseGame = function() {
  Game.setBoard(3,
    new TitleScreen("You lose!", "Press space to play again", playGame)
  );
};

window.addEventListener("load", function() {
  Game.initialize("game", sprites, startGame);
});

const Spawner = function(coord, nclients, type, f) {
  this.nclients = nclients;
  this.type = type;
  this.f = f;
  this.time = this.f;
  this.client = new Client(coord.x, coord.y, 100, type);

  GameManager.notifyClients(this.nclients);

  this.step = function(dt) {
    this.time -= dt;

    if (this.nclients > 0 && this.time < 0) {
      this.time = this.f;

      this.board.add(Object.create(this.client));
      --this.nclients;
    }
  };

  this.draw = function() {};
};

/////////////// BEGIN PLAYER RELATED ENTITIES ///////////////
const Beer = function(x, y,vx) {
  this.setup('Beer', {vx: -vx});
  this.x = x;
  this.y = y;
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
  this.setup('Player', {
    fixedpos: [
      {x:325, y:90},
      {x:357, y:185},
      {x:389, y:281},
      {x:421, y:377}
    ],
    currentpos: 3,
    beer: new Beer(0, 0, 0)
  });
  this.x = this.fixedpos[this.currentpos].x;
  this.y = this.fixedpos[this.currentpos].y;

  let freeup = false; // Control over key 'up' press
  let freedown = false; // Control over key 'down' press
  let freespace = false; // Control over key 'space' press

  this.step = function() {
    if (!Game.keys['up']) freeup = true;
    if (!Game.keys['down']) freedown = true;
    if (!Game.keys['space']) freespace = true;

    if (freeup && Game.keys['up']) {
      freeup = false;
      this.currentpos = this.currentpos == 0 ?
          this.fixedpos.length - 1 :
          --this.currentpos;
    }
    else if (freedown && Game.keys['down']) {
      freedown = false;
      this.currentpos = ++this.currentpos % this.fixedpos.length;
    }
    else if (freespace && Game.keys['space']) {
      freespace = false;
      this.board.add(Object.create(this.beer, {
        'x': {
          value: this.x - sprites.Beer.w,
          enumerable: true,
          writable: true
        },
        'y': {
          value: this.y,
          enumerable: true,
          writable: true
        },
        'vx': {
          value: -200,
          enumerable: true
        }
      }));
    }

    this.x = this.fixedpos[this.currentpos].x;
    this.y = this.fixedpos[this.currentpos].y;
  };
};

Player.prototype = new Sprite();
Player.prototype.type = OBJECT_PLAYER;

/**
 * This player moves or throws beer for every reload tick.
 * Long key press will trigger multiple actions.
 */
var Player2 = function() {
  this.setup('Player', {
    fixedpos: [
      {x: 325, y: 90},
      {x: 357, y: 185},
      {x: 389, y: 281},
      {x: 421, y: 377}
    ],
    currentpos: 3,
    beer: new Beer(0, 0, 0),
    reloadTimeBeer: 0.25,
    reloadTimeMovement: 0.5
  });

  this.reloadBeer = this.reloadTimeBeer;
  this.reloadMovement = this.reloadTimeMovement;
  this.x = this.fixedpos[this.currentpos].x;
  this.y = this.fixedpos[this.currentpos].y;

  this.step = function(dt) {
    this.reloadMovement -= dt;
    if (Game.keys['up'] && this.reloadMovement < 0) {
      Game.keys['up'] = false;
      this.reloadMovement = this.reloadTimeMovement;
      this.currentpos = this.currentpos == 0 ?
          this.fixedpos.length - 1 :
          --this.currentpos;
    }
    else if (Game.keys['down'] && this.reloadMovement < 0) {
      Game.keys['down'] = false;
      this.reloadMovement = this.reloadTimeMovement;
      this.currentpos = ++this.currentpos % this.fixedpos.length;
    }

    this.x = this.fixedpos[this.currentpos].x;
    this.y = this.fixedpos[this.currentpos].y;

    this.reloadBeer -= dt;
    if (Game.keys['space'] && this.reloadBeer < 0) {
      Game.keys['space'] = false;
      this.reloadBeer = this.reloadTimeBeer;

      this.board.add(Object.create(this.beer, {
        'x': {
          value: this.x - sprites.Beer.w,
          enumerable: true,
          writable: true
        },
        'y': {
          value: this.y,
          enumerable: true,
          writable: true
        },
        'vx': {
          value: -200,
          enumerable: true
        }
      }));
    }
  };
};

Player2.prototype = new Sprite();
Player2.prototype.type = OBJECT_PLAYER;
/////////////// END PLAYER RELATED ENTITIES ///////////////


/////////////// BEGIN NPC RELATED ENTITIES ///////////////
var Glass = function(x,y,vx) {
  this.setup('Glass');
  this.x = x;
  this.y = y;
  this.vx = vx;
};

Glass.prototype = new Sprite();
Glass.prototype.type = OBJECT_CLIENT_PROJECTILE;

Glass.prototype.step = function(dt)  {
  this.x += this.vx * dt;

  const collision = this.board.collide(this,OBJECT_PLAYER);
  if (collision) {
    this.board.remove(this);
    GameManager.notifyServed();
  }
};

var Client = function(x,y,vx, sprite) {
  this.setup(sprite, {reloadTime: 0.25});
  this.x = x;
  this.y = y;
  this.vx = vx;
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
  this.setup('Background');
  this.x = 0;
  this.y = 0;

  this.step = function() {};
};

Background.prototype = new Sprite();

const Leftwall = function() {
  this.setup('LeftWall');
  this.x = 0;
  this.y = 0;

  this.step = function() {};
};

Leftwall.prototype = new Sprite();

var DeadZone = function(x, y) {
  this.x = x;
  this.y = y;
  this.w = 10;
  this.h = 80;
  this.type = OBJECT_DEADZONE;

  this.step = function() {
    const collision = this.board.collide(this,
        OBJECT_CLIENT|OBJECT_PLAYER_PROJECTILE|OBJECT_CLIENT_PROJECTILE);

    if (collision) {
      collision.hit(this);

      GameManager.notifyDead();
    }
  };

  this.draw = function() {
    Game.ctx.fillStyle = '#5e7be3';
    Game.ctx.fillRect(x, y, this.w, this.h);
  };
}
/////////////// END GAME RELATED ENTITIES ///////////////

/////////////// BEGIN GAME MANAGER ///////////////
const GameManager = new function () {
  this.npcs = 0;
  this.glasscount = 0;
  this.dead = 0;

  this.reset = function() {
    this.npcs = 0;
    this.glasscount = 0;
    this.dead = 0;
  };

  this.notifyClients = function(n) {
    this.npcs += n;
  };

  this.notifyGlass = function() {
    ++this.glasscount;
    this.check();
  };

  this.notifyServed = function() {
    --this.glasscount;
    --this.npcs;
    this.check();
  };

  this.notifyDead = function() {
    ++this.dead;
    this.check();
  };

  this.check = function() {
    if (!this.npcs && !this.glasscount) {
      winGame();
    }
    else if (this.dead) {
      loseGame();
    }
  };
};
/////////////// END GAME MANAGER ///////////////
