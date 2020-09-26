let player_size = 32, item_size = 16;
let world_radius = 1000, world_size = world_radius * 2;
let item_spawn_rate = 10;
let item_duration = 15000;
const item_types = ['size', 'speed', 'health'];
let log_level = 4;

const log = (level, ...text) => { if (level <= log_level) console.log(`[${level}]`, ...text); }
const msg =  (...m) => new_messages = new_messages.concat(m);
const rand = (lo, hi) => lo + (hi - lo) * Math.random();
const constrain = (n, lo, hi) => Math.max(Math.min(n, hi), lo);
const choose = (arr) => arr[Math.floor(Math.random() * arr.length)];
const floor = Math.floor;
const abs = Math.abs;

class World {
  constructor() {
    this.players = [];
    this.walls = [];
    this.items = [];
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
        let w = choose([s, g + s]);
        let h = choose([s, g + s]);
        let wall = new Rect(x, y, w, h);
        wall.color = `hsl(${floor(225 + rand(-30, 30))}, 35%, ${rand(45, 65)}%)`;
        this.walls.push(wall);
      }
    }
  }

  now() { return Date.now() - this.start_time; }

  newPlayer(id) {
    let p;
    while (true) {
      p = new Player(id, world_radius * rand(-1, 1), world_radius * rand(-1, 1));
      if (!world.walls.some(w => w.hit(p))) break;
    }
    this.players.push(p);
    return p;
  }

  newItem() {
    let item;
    while (true) {
      item = new Rect(world_radius * rand(-1, 1), world_radius * rand(-1, 1), item_size, item_size);
      if (!world.walls.some(w => w.hit(item)) && !world.players.some(p => p.hit(item))) break;
    }
    item.type = choose(item_types);
    item.duration = ['health'].includes(item.type)? 0 : item_duration;
    item.id = `${this.now()}:${Math.random().toString(36).substr(2, 9)}`;
    this.items.push(item);
    return item;
  }

  updatePlayer(pu) {
    let p = world.findPlayerById(pu.id);
    if (!p) return;
    p.x = pu.x;
    p.y = pu.y;
    p.energy = pu.energy;
    p.username = pu.username;
    p.dx = pu.dx;
    p.dy = pu.dy;
    p.w = pu.w;
    p.h = pu.h;
    p.color = pu.color;
    p.speed = pu.speed;
    p.activeItem = pu.activeItem;
    p.itemExpirationTime = pu.itemExpirationTime;
  }

  removePlayer(id) {
    for (let i = this.players.length - 1; i >= 0; i--) {
      if (this.players[i].id == id) this.players.splice(i, 1);
    }
  }
  removeItem(id) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      if (this.items[i].id == id) this.items.splice(i, 1);
    }
  }

  findPlayerById(id) {
    for (let player of this.players) {if (player.id == id) return player;}
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
var flags = require('yargs')
    .option('port', {alias: 'p', default: 3000, describe: 'Port to bind on'})
    .option('interval', {alias: 'i', default: 100, describe: 'Interval in miliseconds of sending data'})
    .option('log_level', {alias: 'l', default: log_level, describe: 'Amount of log, 4=everything, 3=normal, 2=only join/error/system, 1=only error/system'})
    .option('world_radius', {default: world_radius, describe: 'Size of world'})
    .option('item_spawn_rate', {default: item_spawn_rate, describe: 'Interval in seconds of spawning items'})
    .option('no-serverline', {alias: 'o', describe: 'Don\'t use serverline (for nodejs <10)'})
    .help()
    .argv;

log_level = flags.l; // 4=everything, 3=normal, 2=only join/error/system,  1=only error/system
world_radius = flags.world_radius;
world_size = world_radius * 2;
item_spawn_rate = flags.item_spawn_rate;

log(2, 'Running without serverline!');
log(4, 'log_level = ', log_level);
log(4, 'world_radius = ', world_radius);
log(4, 'item_spawn_rate = ', item_spawn_rate)
log(4, 'Starting server!');

// Http server
let express = require('express');
let app = express();
let server = app.listen(flags.p, () => log(1, 'Server listening at http://localhost:' + server.address().port));
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
      bullet_hits.push({b: b, target: target});
      let author = world.findPlayerById(b.author);
      if (author && typeof target.username === 'string') {
        log(4, "bullet_hit", author.username);
        io.to(target.id).emit('damage', b.power, author);
        if (target.energy - b.power <= 0) { // if is dead
          log(3, author.username, 'killed', target.username)
        }
      }
    });

    socket.on('item_used', itemid => {
      log(4, 'item used by ' + id, itemid);
      world.removeItem(itemid)
    });

    socket.on('server_message', msg => {
      new_messages.push(msg);
      log(3, id, 'says', `\"${msg}\"`)
    })
})

let next_newitem = world.now();

function heartbeat() {
  if (next_newitem < world.now() && world.items.length < world.players.length + 2) {
    log(4, `New ${world.newItem().type} Item!`)
    next_newitem = world.now() + item_spawn_rate*1000;
  }
  for (let player of world.players) { // only 'ready clients' update
    io.to(player.id).emit('server_update', world.players, new_bullets, bullet_hits, world.items, new_messages);
  }
  bullet_hits = [];
  new_bullets = [];
  new_messages = [];
}

if (!flags.o) {
  const sl = require("serverline");
  sl.setCompletion(['log_level', 'world', 'world.bullets', 'world.players', 'world.bullets', 'world.players', 'world.newItem()', 'msg()']);
  sl.init({'forceTerminalContext':true});
  sl.setPrompt('> ')
  sl.on('line', function(line) {
    try {
      console.log(eval(line));
    } catch (e) {
      console.error(e);
    }
  })  
}
setInterval(heartbeat, flags.i);