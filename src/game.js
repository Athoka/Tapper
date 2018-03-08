var sprites = {
  Background: { sx: 0, sy: 480, w: 512, h: 480, frames: 1 },
  Player: { sx: 512, sy: 0, w: 56, h: 66, frames: 1},
  NPC: { sx: 512, sy: 66, w: 33, h: 33, frames: 1},
  Beer: { sx: 512, sy: 99, w: 23, h: 32, frames: 1},
  Glass: { sx: 512, sy: 131, w: 23, h: 32, frames: 1},
  LeftWall: { sx: 0, sy: 0, w: 512, h: 480, frames: 1}
};

var OBJECT_PLAYER = 1,
    OBJECT_PLAYER_PROJECTILE = 2,
    OBJECT_CLIENT = 4,
    OBJECT_CLIENT_PROJECTILE = 8,
    OBJECT_DEADZONE = 16;

var startGame = function() {
  var ua = navigator.userAgent.toLowerCase();

  // Only 1 row of stars
  if(ua.match(/android/)) {
    Game.setBoard(0,new Starfield(50,0.6,100,true));
  } else {
    Game.setBoard(0,new Starfield(20,0.4,100,true));
    Game.setBoard(1,new Starfield(50,0.6,100));
    Game.setBoard(2,new Starfield(100,1.0,50));
  }
  Game.setBoard(3,new TitleScreen("Alien Invasion",
                                  "Press fire to start playing",
                                  playGame));
};

var playGame = function() {
  var backboard = new GameBoard();
  backboard.add(new Background());
  Game.setBoard(0, backboard);

  var board = new GameBoard();
  board.add(new Player());
  board.add(new Client(90, 185, 100, 'NPC'));

  board.add(new DeadZone(330, 90));
  board.add(new DeadZone(362, 185));
  board.add(new DeadZone(394, 281));
  board.add(new DeadZone(427, 377));
  board.add(new DeadZone(110, 90));
  board.add(new DeadZone(78, 185));
  board.add(new DeadZone(46, 281));
  board.add(new DeadZone(14, 377));
  Game.setBoard(3,board);
};

var winGame = function() {
  Game.setBoard(3,new TitleScreen("You win!",
                                  "Press fire to play again",
                                  playGame));
};

var loseGame = function() {
  Game.setBoard(3,new TitleScreen("You lose!",
                                  "Press fire to play again",
                                  playGame));
};

var Beer = function(x,y,vx) {
  this.setup('Beer');
  this.x = x;
  this.y = y;
  this.vx = -vx;
};

Beer.prototype = new Sprite();
Beer.prototype.type = OBJECT_PLAYER_PROJECTILE;

Beer.prototype.step = function(dt)  {
  this.x += this.vx * dt;
};

var Player = function() {
  this.setup('Player', { vy: 0, reloadTime: 0.25});

  this.reload = this.reloadTime;
  this.x = 421;
  this.y = 377;
  this.fixedpos = [{x:325,y:90}, {x:357,y:185}, {x:389,y:281}, {x:421,y:377}]
  this.currentpos = 3;
  this.beer = new Beer(0, 0, 0);

  var freeup = false; // Control over key 'up' press
  var freedown = false; // Control over key 'down' press
  var freespace = false; // Control over key 'space' press

  this.step = function() {
    if(!Game.keys['up']) {freeup = true;}
    if(!Game.keys['down']) {freedown = true;}
    if(!Game.keys['space']) {freespace = true;}
    if(freeup && Game.keys['up']) {
      this.currentpos = this.currentpos == 0 ? this.fixedpos.length - 1 : --this.currentpos;
      freeup = false;
    }
    else if(freedown && Game.keys['down']) {
      this.currentpos = ++this.currentpos % this.fixedpos.length;
      freedown = false;
    }
    else if(freespace && Game.keys['space']) {
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
  var collision = this.board.collide(this,OBJECT_PLAYER);
  if(collision) {
    this.board.remove(this);
  } else if(this.x < -this.w + 50) {//TODO
    this.board.remove(this);
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

  var collision = this.board.collide(this,OBJECT_PLAYER_PROJECTILE);
  if(collision) {
    collision.hit(this);
    this.board.add(new Glass(this.x, this.y, 200))
    this.board.remove(this);
  }
};

window.addEventListener("load", function() {
  Game.initialize("game",sprites,playGame);
});


var Background = function() {
  this.setup('Background');

  this.x = 0;
  this.y = 0;

  this.step = function() {
  };
};

Background.prototype = new Sprite();

var DeadZone = function(x, y) {
  this.x = x;
  this.y = y;
  this.w = 10;
  this.h = 80;
  this.type = OBJECT_DEADZONE;

  this.step = function() {
    var collision = this.board.collide(this,OBJECT_CLIENT|OBJECT_PLAYER_PROJECTILE|OBJECT_CLIENT_PROJECTILE);
    if(collision) {
      collision.hit(this);
    }
  };

  this.draw = function() {
    Game.ctx.fillStyle = '#5e7be3';
    Game.ctx.fillRect(x, y, this.w, this.h);
  };
}
