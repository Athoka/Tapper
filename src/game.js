/** @enum */
const Sprites = {
  BACKGROUND: { sx: 0, sy: 480, w: 512, h: 480, frames: 1 },
  PLAYER: { sx: 512, sy: 0, w: 56, h: 66, frames: 1 },
  NPC: { sx: 512, sy: 66, w: 33, h: 33, frames: 1 },
  BEER: { sx: 512, sy: 99, w: 23, h: 32, frames: 1 },
  GLASS: { sx: 512, sy: 131, w: 23, h: 32, frames: 1 },
  LEFT_WALL: { sx: 0, sy: 0, w: 512, h: 480, frames: 1 },
};

const OBJECT_PLAYER = 1;
const OBJECT_PLAYER_PROJECTILE = 2;
const OBJECT_CLIENT = 4;
const OBJECT_CLIENT_PROJECTILE = 8;
const OBJECT_DEADZONE = 16;

const CLIENTS_FIXED_POS = [
  { x: 110, y: 80 },
  { x: 78, y: 175 },
  { x: 46, y: 271 },
  { x: 14, y: 367 },
];

/** @enum */
const BoardIds = {
  TITLE: 0,
  WIN: 1,
  LOSE: 2,
  BACKGROUND: 3,
  ENTITIES: 4,
  LEFT_WALL: 5,
};

const startGame = function() {
  const ua = navigator.userAgent.toLowerCase();

  setup();
  Game.activateBoard(BoardIds.TITLE);
};

const setup = function() {
  //////////////// Title screen ////////////////
  const titleBoard = new GameBoard();
  titleBoard.add(
    new TitleScreen('Tapper', 'Press space to start playing', playGame)
  );
  Game.setBoard(BoardIds.TITLE, titleBoard);

  //////////////// Win screen ////////////////
  const winBoard = new GameBoard();
  winBoard.add(
    new TitleScreen('You win!', 'Press space to start playing', playGame)
  );
  Game.setBoard(BoardIds.WIN, winBoard);

  //////////////// Lose screen ////////////////
  const loseBoard = new GameBoard();
  loseBoard.add(
    new TitleScreen('You lose!', 'Press space to start playing', playGame)
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

window.addEventListener('load', function() {
  Game.initialize('game', Sprites, startGame);
});

const Spawner = function(coord, nclients, type, f) {
  this.initClients = nclients;
  this.nclients = this.initClients;
  this.type = type;
  this.f = f;
  this.time = this.f;
  this.client = new Client(coord.x, coord.y, 100, type);

  this.reset = function() {
    this.time = this.f;
    this.nclients = this.initClients;
    GameManager.notifyClients(this.nclients);
  };
  this.reset();

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

/////////////// BEGIN GAME MANAGER ///////////////
const GameManager = new function() {
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
    if (this.dead) {
      loseGame();
    } else if (!this.npcs && !this.glasscount) {
      winGame();
    }
  };
}();
/////////////// END GAME MANAGER ///////////////
