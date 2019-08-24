const player_size = 32;
const world_radius = 1000;
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
    this.energy = 100;
    this.join_time = world.now();
  }
}

class Bullet extends Rect {
  constructor (x, y, vx, vy, author='None', spawn_time) {
    if (vx != 0) {
      super(x, y, bullet_length, 10);
      this.vx = bullet_speed * Math.sign(vx);
      this.vy = 0;
    } else if (vy != 0) {
      super(x, y, 10, bullet_length);
      this.vx = 0;
      this.vy = bullet_speed * Math.sign(vy);
    }
    this.x0 = x;
    this.y0 = y;
    this.author = author;
    this.color = '#e22';
    this.spawn_time = spawn_time;
  }
  update() {
    const age = world.now() - this.spawn_time;
    this.x = this.x0 + this.vx * age;
    this.y = this.y0 + this.vy * age;
    for (let wall of world.walls) {
      if (this.hit(wall)) world.bullets.splice(world.bullets.indexOf(this), 1);
    } // remove bullet if hit wall
  }
}

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
    let p = this.findPlayerById(id);
    p.x = p_new.x;
    p.y = p_new.y;
    p.energy = p_new.energy;
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
    .help()
    .argv
;

// Http server
let express = require('express');
let app = express()
const listening = function() {console.log('Server listening at port ' + server.address().port);};
let server = app.listen(argv.p, listening); // listen() if server started
app.use(express.static('client'));


// ========= BEGIN =========================================================

let world = new World();

let io = require('socket.io')(server); // socket.io uses http server

io.sockets.on('connection', socket => {
    let id = socket.id.substring(16, 20) // last 4 charaters are less nonsense
    console.log('New client connected with id ' + id);

    socket.on('player_join', () => {
        console.log('Player ' + id + ' joined');
        let new_player = world.newPlayer(socket);
        world.age = world.now();
        socket.emit('server_welcome', new_player, world);
    });

    socket.on('player_update', (p) => {
      // TODO: sanity check p
      world.updatePlayer(socket.id, p);
    });

    socket.on('disconnect', () => {
      world.removePlayer(socket.id); // remove zombie players
      console.log(id + ' left');
    });

    socket.on('player_reset', () => {
      console.log('Resetting ' + id)
      world.removePlayer(socket.id);
      world.newPlayer(socket);
      socket.emit('start', world.findPlayerById(socket.id), world);
    })

    socket.on('bullet', (spawn_time, x, y, vx, vy) => {
      world.bullets.push(new Bullet(x, y, vx, vy, socket.id))
    })
})

// kind of main loop thing
function heartbeat() {
  for (let player of world.players) { // only 'ready clients' update
    io.to(player.id).emit('server_update', world.players, world.bullets);
  }
  for (let bullet of world.bullets) {
    bullet.update();
  }
  // for (let wall of world.walls) {
  // world.bullets = world.bullets.filter((value, index, arr) => !value.hits(wall))
  // }
  updateCount++;
}

let updateCount = 0;
setInterval(heartbeat, argv.i);
