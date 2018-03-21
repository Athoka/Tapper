/** @enum */
const Sprites = {
  BACKGROUND: { sx: 0, sy: 480, w: 512, h: 480, frames: 1 },
  PLAYER: { sx: 512, sy: 0, w: 56, h: 66, frames: 1},
  NPC: { sx: 512, sy: 66, w: 33, h: 33, frames: 1},
  BEER: { sx: 512, sy: 99, w: 23, h: 32, frames: 1},
  GLASS: { sx: 512, sy: 131, w: 23, h: 32, frames: 1},
  LEFT_WALL: { sx: 0, sy: 0, w: 512, h: 480, frames: 1},
};

const OBJECT_PLAYER = 1;
const OBJECT_PLAYER_PROJECTILE = 2;
const OBJECT_CLIENT = 4;
const OBJECT_CLIENT_PROJECTILE = 8;
const OBJECT_DEADZONE = 16;

const CLIENTS_FIXED_POS = [
  {x: 110, y: 80},
  {x: 78, y: 175},
  {x: 46, y: 271},
  {x: 14, y: 367},
]

/** @enum */
const BoardIds = {
  TITLE: 0,
  WIN: 1,
  LOSE: 2,
  BACKGROUND: 3,
  ENTITIES: 4,
  LEFT_WALL: 5,
}

const startGame = function() {
  const ua = navigator.userAgent.toLowerCase();

  setup();
  Game.activateBoard(BoardIds.TITLE);
};

const setup = function() {
  //////////////// Title screen ////////////////
  const titleBoard = new GameBoard();
  titleBoard.add(
    new TitleScreen("Tapper", "Press space to start playing", playGame)
  );
  Game.setBoard(BoardIds.TITLE, titleBoard);

  //////////////// Win screen ////////////////
  const winBoard = new GameBoard();
  winBoard.add(
    new TitleScreen("You win!", "Press space to start playing", playGame)
  );
  Game.setBoard(BoardIds.WIN, winBoard);

  //////////////// Lose screen ////////////////
  const loseBoard = new GameBoard();
  loseBoard.add(
    new TitleScreen("You lose!", "Press space to start playing", playGame)
  );
  Game.setBoard(BoardIds.LOSE, loseBoard);

  //////////////// Background ////////////////
  const backboard = new GameBoard();
  backboard.add(new Background());
  Game.setBoard(BoardIds.BACKGROUND, backboard);

  //////////////// Entities ////////////////
  const board = new GameBoard();
  // rigth side deadzones
  board.add(new DeadZone(335, 90));
  board.add(new DeadZone(367, 185));
  board.add(new DeadZone(399, 281));
  board.add(new DeadZone(431, 377));
  // left side deadzones
  board.add(new DeadZone(100, 80));
  board.add(new DeadZone(68, 175));
  board.add(new DeadZone(36, 271));
  board.add(new DeadZone(4, 367));

  // player
  board.add(new Player());

  // spawner
  for (let x = 0; x < 1; x++) {
    const r = 2;
    board.add(new Spawner(CLIENTS_FIXED_POS[x], 1, 'NPC', 1 + r * x));
  }
  Game.setBoard(BoardIds.ENTITIES, board);

  //////////////// Left wall ////////////////
  const frontboard = new GameBoard();
  frontboard.add(new Leftwall());
  // left side deadzones so they are visible
  frontboard.add(new DeadZone(100, 80));
  frontboard.add(new DeadZone(68, 175));
  frontboard.add(new DeadZone(36, 271));
  frontboard.add(new DeadZone(4, 367));
  Game.setBoard(BoardIds.LEFT_WALL, frontboard);
};

const activateGame = function() {
  // first deactivate every non-game boards
  Game.deactivateBoard(BoardIds.TITLE);
  Game.deactivateBoard(BoardIds.WIN);
  Game.deactivateBoard(BoardIds.LOSE);
  // now activate every game board
  Game.activateBoard(BoardIds.BACKGROUND);
  Game.activateBoard(BoardIds.ENTITIES);
  Game.activateBoard(BoardIds.LEFT_WALL);
};

const deactivateGame = function() {
  // deactivate every game board
  Game.deactivateBoard(BoardIds.BACKGROUND);
  Game.deactivateBoard(BoardIds.ENTITIES);
  Game.deactivateBoard(BoardIds.LEFT_WALL);
};

const playGame = function() {
  GameManager.reset();
  activateGame();
};

const winGame = function() {
  deactivateGame();
  Game.activateBoard(BoardIds.WIN);
};

const loseGame = function() {
  deactivateGame();
  Game.activateBoard(BoardIds.LOSE);
};

window.addEventListener("load", function() {
  Game.initialize("game", Sprites, startGame);
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
const Beer = function(x, y, vx) {
  this.setup('BEER', {vx: -vx});
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
  this.setup('PLAYER', {
    fixedPos: [
      {x: 325, y: 90},
      {x: 357, y: 185},
      {x: 389, y: 281},
      {x: 421, y: 377},
    ],
    currentPos: 3,
    beer: new Beer(0, 0, 0),
  });
  this.x = this.fixedPos[this.currentPos].x;
  this.y = this.fixedPos[this.currentPos].y;

  let freeUp = false; // Control over key 'up' press
  let freeDown = false; // Control over key 'down' press
  let freeSpace = false; // Control over key 'space' press

  this.step = function() {
    if (!Game.keys['up']) freeUp = true;
    if (!Game.keys['down']) freeDown = true;
    if (!Game.keys['space']) freeSpace = true;

    if (freeUp && Game.keys['up']) {
      freeUp = false;
      this.currentPos = this.currentPos == 0 ?
          this.fixedPos.length - 1 :
          --this.currentPos;
    }
    else if (freeDown && Game.keys['down']) {
      freeDown = false;
      this.currentPos = ++this.currentPos % this.fixedPos.length;
    }
    else if (freeSpace && Game.keys['space']) {
      freeSpace = false;
      this.board.add(Object.create(this.beer, {
        'x': {
          value: this.x - Sprites.BEER.w,
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
        },
      }));
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
var Player2 = function() {
  this.setup('PLAYER', {
    fixedPos: [
      {x: 325, y: 90},
      {x: 357, y: 185},
      {x: 389, y: 281},
      {x: 421, y: 377},
    ],
    currentPos: 3,
    beer: new Beer(0, 0, 0),
    reloadTime: 0.25,
    restTime: 0.5,
  });

  this.reload = this.reloadTime;
  this.rest = this.restTime;
  this.x = this.fixedPos[this.currentPos].x;
  this.y = this.fixedPos[this.currentPos].y;

  this.step = function(dt) {
    this.rest -= dt;
    if (Game.keys['up'] && this.rest < 0) {
      Game.keys['up'] = false;
      this.rest = this.restTime;
      this.currentPos = this.currentPos == 0 ?
          this.fixedPos.length - 1 :
          --this.currentPos;
    }
    else if (Game.keys['down'] && this.rest < 0) {
      Game.keys['down'] = false;
      this.rest = this.restTime;
      this.currentPos = ++this.currentPos % this.fixedPos.length;
    }

    this.x = this.fixedpPos[this.currentPos].x;
    this.y = this.fixedPos[this.currentPos].y;

    this.reload -= dt;
    if (Game.keys['space'] && this.reload < 0) {
      Game.keys['space'] = false;
      this.reload = this.reloadTime;

      this.board.add(Object.create(this.beer, {
        'x': {
          value: this.x - Sprites.BEER.w,
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
        },
      }));
    }
  };
};

Player2.prototype = new Sprite();
Player2.prototype.type = OBJECT_PLAYER;
/////////////// END PLAYER RELATED ENTITIES ///////////////


/////////////// BEGIN NPC RELATED ENTITIES ///////////////
var Glass = function(x, y, vx) {
  this.setup('GLASS');
  this.x = x;
  this.y = y;
  this.vx = vx;
};

Glass.prototype = new Sprite();
Glass.prototype.type = OBJECT_CLIENT_PROJECTILE;

Glass.prototype.step = function(dt)  {
  this.x += this.vx * dt;

  const collision = this.board.collide(this, OBJECT_PLAYER);
  if (collision) {
    this.board.remove(this);
    GameManager.notifyServed();
  }
};

var Client = function(x, y, vx, sprite) {
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
  this.setup('BACKGROUND');
  this.x = 0;
  this.y = 0;

  this.step = function() {};
};

Background.prototype = new Sprite();

const Leftwall = function() {
  this.setup('LEFT_WALL');
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
        OBJECT_CLIENT | OBJECT_PLAYER_PROJECTILE | OBJECT_CLIENT_PROJECTILE);

    if (collision) {
      collision.hit(this);

      GameManager.notifyDead();
    }
  };

  this.draw = function() {
    Game.ctx.fillStyle = '#5e7be3';
    Game.ctx.fillRect(this.x, this.y, this.w, this.h);
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
