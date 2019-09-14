const player_size = 32;
let world_radius = 1000;
let world_size = world_radius * 2
let log_level = 3;

const log = (level, text) => {if (level <= log_level) console.log(`[${level}] ${text}`);}
const rand = (lo, hi) => lo + (hi - lo) * Math.random();
const constrain = (n, lo, hi) => Math.max(Math.min(n, hi), lo);
const randarray = (arr) => arr[Math.floor(Math.random() * arr.length)];
const floor = Math.floor;
const abs = Math.abs;

class World {
  constructor() {
    this.players = [];
    this.walls = [];
    this.start_time = Date.now();
    this.age = 0;
    this.generate_walls();
    log(4, 'world constructed!')
  }

  generate_walls() {
    let c = 'hsl(225, 35%, 55%)';
    this.walls.push(
      new Rect(-world_radius - 10, -world_radius - 10, 10, world_size + 30, c),
      new Rect( world_radius + 10, -world_radius - 10, 10, world_size + 30, c),
      new Rect(-world_radius - 10, -world_radius - 10, world_size + 20, 10, c),
      new Rect(-world_radius, world_radius + 10, world_size + 20, 10, c)
    )
    const g = 200, s = 30;
    for (let x = -world_radius; x < world_radius; x += g) {
      for (let y =  -world_radius; y < world_radius; y += g) {
        if (Math.random() < 0.5) continue;
        let w = randarray([s, g + s]);
        let h = randarray([s, g + s]);
        let wall = new Rect(x, y, w, h);
        wall.color = `hsl(${floor(225 + rand(-30, 30))}, 35%, ${rand(45, 65)}%)`;
        this.walls.push(wall);
      }
    }
  }

  now() { return Date.now() - this.start_time; }

  newPlayer(id) {
    let p, hit = true;
    // spawn niet in muren
    while (hit) {
      p = new Player(id, world_radius * rand(-1, 1), world_radius * rand(-1, 1));
      hit = world.walls.some(w => w.hit(p));
    }
    this.players.push(p);
    return p;
  }

  updatePlayer(pu) {
    let p = world.findPlayerById(pu.id);
    p.x = pu.x;
    p.y = pu.y;
    p.energy = pu.energy;
    p.username = pu.username;
    p.dx = pu.dx;
    p.dy = pu.dy;
  }

  removePlayer(id) {
    for (var i = this.players.length - 1; i >= 0; i--) {
      if (this.players[i].id == id) this.players.splice(i, 1);
    }
  }

  findPlayerById(id) {
    for (let player of this.players) {
      if (player.id == id) return player;
    }
  }
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
let server = app.listen(argv.p, () => log(1, 'Server listening at port ' + server.address().port));
app.use(express.static('client'));
let io = require('socket.io')(server); // socket.io uses http server

// ========= BEGIN =========================================================
let world = new World();
let bullet_hits = [];
let new_bullets = [];

io.sockets.on('connection', socket => {
    let id = socket.id.substring(16, 20) // last 4 charaters are less nonsense
    log(3, 'New client: ' + id);

    socket.on('player_join', () => {
        log(2, id + ' joined the game');
        let new_player = world.newPlayer(socket.id);
        world.age = world.now();
        socket.emit('server_welcome', new_player, world);
    });

    socket.on('player_update', p => {
      world.updatePlayer(p);
    });

    socket.on('disconnect', () => {
      world.removePlayer(socket.id); // remove zombie players
      log(2, id + ' disconnected');
    });

    socket.on('bullet_new', b => {
      log(4,'Recieved bullet emit from ' + id)
      new_bullets.push(b);
    });

    socket.on('bullet_hit', (b, target) => {
      bullet_hits.push({id: b.id, target: target});
      if (target.energy > 0) {     //undefined > 0 == false
        target.energy -= b.power;
      }
    });
})

function heartbeat() {
  io.sockets.emit('server_update', world.players, bullet_hits, new_bullets);
  bullet_hits = new_bullets = [];
}

setInterval(heartbeat, argv.i);