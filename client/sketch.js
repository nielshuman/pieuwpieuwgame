// p5.disableFriendlyErrors = true; // disables FES
const names = ["pluisje", "vlekje", "kruimel", "poekie", "fluffie", "muffin",
"diesel", "spike", "simba", "lucky", "spoekie", "tijger", "snuf", "pien",
"woezel", "pip", "puck", "nugget"];
const post_names = ["the destroyer", "the great", "the fool", "the conqueror",
"of death", "doom", "the insane", "the indestructable", "the wicked",
"the brutal", "frost", "the foul", "the pirate"];
const pre_names = ["super", "mad ", "mega", "ultra", "hyper", "power", "giga",
"insane ", "bad ", "zombie ", "ghost ", "robot ", "ninja ", "pirate ",
"screaming ", "angry ", "happy ", "danger "];

let username_box;
let walls = [], player, ready, world, socket;
let W, H, W2, H2, fps = 0;
let time;

let shootSound, hitSound, wallHitSound, font;
function preload() {
  soundFormats('wav');
  shootSound = loadSound('assets/shoot.wav');
  hitSound = loadSound('assets/hit.wav');
  wallHitSound = loadSound('assets/hitwall.wav');
  font = loadFont('assets/gamer.ttf');
}

function setup() {
  // frameRate(30);
  createCanvas(windowWidth, windowHeight);
  W = width; H = height; W2 = W / 2; H2 = H / 2;
  socket = io();
  socket.on('server_update', on_server_update);
  socket.on('server_welcome', on_server_welcome);
  socket.emit('player_join');
  username_box = select("#username");
  username_box.value((random() < 0.5) ? random(names) + ' ' + random(post_names) : random(pre_names) + random(names));
      masterVolume(0);
}

function on_server_welcome(p, w) {
  // start signal from server
  world = new World(w);
  time = world.now();
  console.log("p", p);
  player = Player.from_obj(p);
  player.hit_list = world.walls;
  player.color = p.color;
  ready = true;
  // hbar = new Bar(width -220, height - 50, 200, 30);
}

function on_server_update(players, bullets) {
  world.players = players.map(Player.from_obj);
  world.bullets = bullets.map(Bullet.from_obj);
  socket.emit('player_update', player);
}

function draw() {
  background("#76a");
  if (!ready) {return};

  let prev_time = time;
  time = world.now();
  dt = time - prev_time;
  // controls and movement
  let speed = 0.42 * dt;
  if (keyIsDown(87) || keyIsDown(UP_ARROW)) { player.move(0, -speed); player.dir = 'up'; }
  if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) { player.move(0, speed); player.dir = 'down'; }
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) { player.move(-speed, 0); player.dir = 'left'; }
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) { player.move(speed, 0); player.dir = 'right'; }

  // rendering world
  push();
  translate(W2 - player.x - player.w / 2, H2 - player.y - player.h / 2);
  for (let wall of world.walls) {
    wall.show();
  }
  for (let p of world.players) {
    (p.id == player.id ? player : p).show();
  }
  for (let bb of world.bullets) {
    bb.update();
    bb.show();
  }
  do_particles(dt);
  pop();

  // hbar.updateval(frameCount / 10);
  // hbar.show();
  if (frameCount % 20 == 0) fps = frameRate();
  fill(255);
  stroke(0);
  text(`FPS: ${fps.toFixed(2)}`, 10, height - 10);
  text(`NOW: ${world.now()}`, 10, height - 30);
  player.username = username_box.value().substring(0, 26).toUpperCase();
  if (player.energy > 0) player.energy = min(100, player.energy + 3 * dt / 1000);
}

function keyPressed() {
  if (key == 'm') {
    if (getMasterVolume() == 0) {
      masterVolume(1);
      console.log('Unmuted');
    } else {
      masterVolume(0);
      console.log('Muted');
    }
  } else if (key == ' ' || key == 'b') {
    let vx = 0, vy = 0, x, y;
    switch (player.dir) {
      case 'up':
        x = player.x + (player.w / 2) - 5;
        y = player.y;
        vy = - 1;
        break;
      case 'down':
        x = player.x + (player.w / 2) - 5;
        y = (player.y + player.h) - 10;
        vy = 1;
        break;
      case 'left':
        x = player.x;
        y = player.y + (player.h / 2) - 5;
        vx = -1;
        break;
      case 'right':
        x = (player.x + player.w) - 10;
        y = player.y + (player.h / 2) - 5;
        vx = 1;
        break;
    }
    const bullet_cost = (key == ' ') ? 4 : 0; // 'b' is cheat free bullet
    if (player.energy > bullet_cost) {
      player.energy -= bullet_cost;
      let bullet_power = 17 - 0.1 * player.energy + random(-3, 3);
      socket.emit('bullet', world.now(), x, y, vx, vy, bullet_power);
      shootSound.play();
      particle_fx(player.mx + vx * player.w, player.my + vy * player.h, 50, 5, "#fff");

    }
  } else if (key == 'x') {
      player.energy = max(0, player.energy - random(10,30));
  }
}
