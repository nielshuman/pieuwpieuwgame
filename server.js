const player_size = 32;
const world_radius = 2000;
const world_size = world_radius * 2
const bullet_length = 30;
const bullet_speed = 10;

const rand = (lo, hi) => lo + (hi - lo) * Math.random();
const constrain = (n, lo, hi) => Math.max(Math.min(n, hi), lo);
const randarray = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randpos = function() {
  let x = rand(-world_radius, world_radius);
  let y = rand(-world_radius, world_radius);
  return new Rect(x, y, player_size, player_size)
}

const floor = Math.floor;

class Rect {
  constructor(x, y, w, h, c='#000') {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = c;
  }

  hit(other) {
    return (this.x + this.w >= other.x &&    // r1 right edge past r2 left
            this.x <= other.x + other.w &&   // r1 left edge past r2 right
            this.y + this.h >= other.y &&    // r1 top edge past r2 bottom
            this.y <= other.y + other.h);
  }
}

class Player extends Rect {
  constructor(id, x, y) {
    super(x, y, player_size, player_size, '#d60');
    this.id = id;
  }
}

class Bullet extends Rect {
  constructor (x, y, vx, vy, author='None') {
    if (vx != 0) {
      super(x, y, bullet_length, 10)
    } else if (vy != 0) {
      super(x, y, 10, bullet_length)
    }
    this.vx = constrain(vx, -1, 1) * bullet_speed;
    this.vy = constrain(vy, -1, 1) * bullet_speed;
    this.author = author;
    this.color = '#e22';
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    for (let wall of world.walls) {if (this.hit(wall)) world.bullets.splice(world.bullets.indexOf(this), 1);} // remove bullet if hit wall
  }
}

class World {
  constructor() {
    this.players = [];
    this.bullets = [];
    this.walls = [];

    // outside walls
    this.walls.push(
      new Rect(-world_radius-10, -world_radius, 10, world_size+20),
      new Rect(world_radius+10, -world_radius, 10, world_size+20),
      new Rect(-world_radius, -world_radius-10, world_size+20, 10),
      new Rect(-world_radius, world_radius+10, world_size+20, 10)
    )
    
    // random level walls
    const g = 125, s = 25;
    for (let x = -g * 3; x < world_size + g * 3; x += g) {
      for (let y =  -g * 3; y < world_size + g * 3; y += g) {
        if (Math.random() < 0.3) continue;
        let w = randarray([s, g + s]);
        let h = randarray([s, g + s]);
        if (w == s && h == s) continue;
        let wall = new Rect(x, y, w, h);
        wall.color = `hsl(${floor(rand(240, 300))}, 10%, ${rand(5, 15)}%)`;
        this.walls.push(wall);
      }
    }
  }
  
  newPlayer(socket) {
    let pos, hit = true;
    // spawn niet in muren
    while (hit) {
      hit = false;
      pos = randpos();
      for (let wall of world.walls) {
        if (wall.hit(pos)) hit = true;
      }
    }
    this.players.push(new Player(socket.id, pos.x, pos.y));
  }

  removePlayer(id) {
    for (var i = this.players.length - 1; i >= 0; i--) {
      if (this.players[i].id === id) {
        this.players.splice(i);
      }
    }
    // filter() ?
  }
  
  updatePlayer(id, p) {
    for (var i = this.players.length - 1; i >= 0; i--) {
      if (this.players[i].id == id) {
        this.players[i].x = p.x;
        this.players[i].y = p.y;
      }
    }
  }

  findPlayerById(id) {
    for (let player of this.players) {
      if (player.id == id) {
        return player;
      } 
    }
  }
}

// command line arguments
var argv = require('yargs')
    .option('port', {
      alias: 'p',
      default: 3000,
      describe: 'port to bind on'
    })
    .option('interval', {
      alias: 'i',
      default: 33, // 30 Hz
      describe: 'Interval in miliseconds of sending data'
    })
    .help('h')
    .alias('h', 'help')
    .argv
;

// Http server
let express = require('express');
let app = express()
const listening = function() {console.log('Server listening at port ' + server.address().port);};
let server = app.listen(argv.p, listening); // listen() if server started
app.use(express.static('client'));

//sockets thing

let world = new World();

let io = require('socket.io')(server); // socket.io uses http server

io.sockets.on('connection', socket => {
    let id = socket.id.substring(16, 20) // last 4 charaters are less nonsense
    console.log('New client connected with id ' + id);
    socket.on('ready', () => {
        console.log('Player ' + id + ' is ready');
        world.newPlayer(socket);
        socket.emit('start', world.findPlayerById(socket.id), world);
    });

    socket.on('update', (p) => {
      world.updatePlayer(socket.id, p);
    });

    socket.on('disconnect', () => {
      world.removePlayer(socket.id); // remove zombie players
      console.log(id + ' left');
    });

    socket.on('reset', () => {
      console.log('Resetting ' + id)
      world.removePlayer(socket.id);
      world.newPlayer(socket);
      socket.emit('start', world.findPlayerById(socket.id), world);
    })

    socket.on('bullet', (x, y, vx, vy) => {
      world.bullets.push(new Bullet(x, y, vx, vy, socket.id))
    })
})

// kind of main loop thing
function update() {
  for (let player of world.players) { // only 'ready clients' update
    io.to(player.id).emit('update', world);
  }
  for (let bullet of world.bullets) {
    bullet.update();
  }
  // for (let wall of world.walls) {  
  // world.bullets = world.bullets.filter((value, index, arr) => !value.hits(wall))
  // }

}

setInterval(update, argv.i);