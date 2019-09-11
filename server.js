const player_size = 32;
let world_radius = 1000;
let world_size = world_radius * 2
let log_level = 3;

const log = (level, text) => {
  if (level <= log_level) console.log(`[${level}] ${text}`);
  //tijd?
}


const rand = (lo, hi) => lo + (hi - lo) * Math.random();
const constrain = (n, lo, hi) => Math.max(Math.min(n, hi), lo);
const randarray = (arr) => arr[Math.floor(Math.random() * arr.length)];
const floor = Math.floor;
const abs = Math.abs;
const randpos = function() {
  let x = rand(-world_radius, world_radius);
  let y = rand(-world_radius, world_radius);
  return new Rect(x, y, player_size, player_size)
}

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
    this.energy = 100;
    this.join_time = world.now();
    this.dx = 0; this.dy = -1;
  }
}

class Bullet extends Rect {
  constructor (x, y, vx, vy, author='None', spawn_time, power) {    
    vx = Math.sign(vx);
    vy = Math.sign(vy)
    if (vx == 0) { // position bullet at centre point
      super(x - 5, y - 15, 10, 30);
    } else {
      super(x - 15, y - 5, 30, 10); 
    }
    this.vx = Bullet.speed * vx;
    this.vy = Bullet.speed * vy;
    this.x0 = this.x;
    this.y0 = this.y;
    this.author = author;
    this.color = '#e22';
    this.spawn_time = spawn_time;
    this.prev_age = 0;
    this.max_age = Bullet.max_age;
    this.update();
    this.id = `${this.author}:${this.spawn_time}`
    this.power = power;
  }
  update() {
    const new_age = world.now() - this.spawn_time;
    let age = this.prev_age;
    this.prev_age = new_age;

    if (age >= this.max_age) {
      this.remove();
      return;
    }
    while (age < new_age) {
      this.x = this.x0 + this.vx * age;
      this.y = this.y0 + this.vy * age;
      for (let wall of world.walls) {
        if (this.hit(wall)) {
          this.max_age = age;
          return;
        }
      }
      age += Bullet.MIN_DT
    }
  }
  remove() {
    world.bullets.splice(world.bullets.indexOf(this), 1);
    log(4, 'Bullet removed!')
  }
}
Bullet.MIN_DT = 10;
Bullet.speed = 0.75;
Bullet.max_age = world_size / Bullet.speed;


class World {
  constructor() {
    this.players = [];
    this.bullets = [];
    this.walls = [];
    this.start_time = Date.now();

    // outside walls
    this.walls.push(
      new Rect(-world_radius - 10, -world_radius - 10, 10, world_size + 30),
      new Rect( world_radius + 10, -world_radius - 10, 10, world_size + 30),
      new Rect(-world_radius - 10, -world_radius - 10, world_size + 20, 10),
      new Rect(-world_radius, world_radius + 10, world_size + 20, 10)
    )

    // random level walls
    const g = 125, s = 25;
    for (let x = -world_radius; x < world_radius; x += g) {
      for (let y =  -world_radius; y < world_radius; y += g) {
        if (Math.random() < 0.5) continue;
        let w = randarray([s, g + s]);
        let h = randarray([s, g + s]);
        let wall = new Rect(x, y, w, h);
        wall.color = `hsl(${floor(rand(240, 300))}, 10%, ${rand(5, 15)}%)`;
        this.walls.push(wall);
      }
    }
    log(4, 'world constructed!')
  }

  now() { return Date.now() - this.start_time; }

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
    let new_player = new Player(socket.id, pos.x, pos.y);
    this.players.push(new_player);
    return new_player;
  }

  removePlayer(id) {
    for (var i = this.players.length - 1; i >= 0; i--) {
      if (this.players[i].id === id) this.players.splice(i, 1);
    }
  }

  updatePlayer(id, p_new) {
    try {
      let p = this.findPlayerById(id);
      p.x = p_new.x;
      p.y = p_new.y;
      p.energy = p_new.energy;
      p.username = p_new.username;
    } catch(error) {
      log(1, `Update of ${id.substring(16, 20)} failed! Client input: ${p_new}`)
      // kick?
    }

  }

  findPlayerById(id) {
    for (let player of this.players) {
      if (player.id == id) return player;
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
      default: 100, // 10 Hz
      describe: 'Interval in miliseconds of sending data'
    })
    .option('log_level', {
      alias: 'l',
      default: log_level,
      describe: 'Amount of log, 4=everything, 3=normal, 2=only join/error/system, 1=only error/system'
    })
    .option('world_radius', {
      default: world_radius,
      describe: 'Size of world'
    })
    .help()
    .argv;

log_level = argv.l; // 4=everything, 3=normal, 2=only join/error/system,  1=only error/system
world_radius = argv.world_radius;
world_size = world_radius * 2

log(4, 'log_level = ' + log_level)
log(4, 'world_radius = ' + world_radius)
log(4, 'Starting server!')
// Http server
let express = require('express');
let app = express();
const listening = function() {log(1, 'Server listening at port ' + server.address().port);};
let server = app.listen(argv.p, listening); // listen() if server started
app.use(express.static('client'));


// ========= BEGIN =========================================================

let world = new World();

let io = require('socket.io')(server); // socket.io uses http server

io.sockets.on('connection', socket => {
    let id = socket.id.substring(16, 20) // last 4 charaters are less nonsense
    log(2, 'New client: ' + id);

    socket.on('player_join', () => {
        log(2, id + ' joined the game');
        let new_player = world.newPlayer(socket);
        world.age = world.now();
        socket.emit('server_welcome', new_player, world);
    });

    socket.on('player_update', (p) => {
      world.updatePlayer(socket.id, p);
    });

    socket.on('disconnect', () => {
      world.removePlayer(socket.id); // remove zombie players
      log(2, id + ' disconnected');
    });

    socket.on('player_reset', () => {
      log(3, 'Resetting ' + id)
      world.removePlayer(socket.id);
      world.newPlayer(socket);
      socket.emit('start', world.findPlayerById(socket.id), world);
    });

    socket.on('bullet', (spawn_time, x, y, vx, vy, bullet_power) => {
      log(4,'Recieved bullet emit from ' + id)
      world.bullets.push(new Bullet(x, y, vx, vy, socket.id, spawn_time, bullet_power))
    });

    socket.on('bullet_hitplayer', (bid) => {
      for (let b of world.bullets) {
        if (b.id == bid) {
          b.remove();
        }
      }
    });
})

// Nu updaten de bullets 100x per sec :D
function heartbeat() {
  for (let bullet of world.bullets) {
    bullet.update();
  }
  for (let player of world.players) { // only 'ready clients' update
    io.to(player.id).emit('server_update', world.players, world.bullets);
  }
}

setInterval(heartbeat, argv.i);
