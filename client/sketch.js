p5.disableFriendlyErrors = true; // disables FES
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
let W, H, W2, H2, fps = 0, screen_rect;
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

let screenshake = 0;
function draw() {
  background("#76a");
  if (!ready) {return};

  let prev_time = time;
  time = world.now();
  dt = time - prev_time;
  // controls and movement
  let speed = 0.42 * dt;
  if (keyIsDown(87) || keyIsDown(UP_ARROW)) { player.move(0, -speed); }
  if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) { player.move(0, speed); }
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) { player.move(-speed, 0); }
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) { player.move(speed, 0); }

  // rendering world
  push();
  translate(W2 - player.mx, H2 - player.my);
  // screen_rect = new Rect(player.x + player)
  if (screenshake > 0) {
    screenshake--;
    translate(random(-8, 8), random(-8, 8));
  }
  for (let wall of world.walls) {
    wall.show();
  }
  for (let p of world.players) {
    (p.id == player.id ? player : p).show();
  }
  for (let b of world.bullets) {
    b.update();
    b.show();
  }
  do_particles(dt);
  pop();

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
    let dx = player.dx, dy = player.dy;
    let x = player.mx + dx * player.w;
    let y = player.my + dy * player.h;
    const bullet_cost = (key == ' ') ? 4 : 0; // 'b' is cheat free bullet
    if (player.energy > bullet_cost) {
      player.energy -= bullet_cost;
      let bullet_power = 17 - 0.1 * player.energy + random(-3, 3);
      socket.emit('bullet', world.now(), x, y, dx, dy, bullet_power);
      shootSound.play();
      particle_fx(x, y, 50, 5, "#fff");

    }
  } else if (key == 'x') {
      player.energy = max(0, player.energy - random(10,30));
  }
}
