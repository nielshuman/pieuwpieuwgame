p5.disableFriendlyErrors = true; // disables FES
const names = ["pluisje", "vlekje", "kruimel", "poekie", "fluffie", "muffin",
"diesel", "spike", "simba", "lucky", "spoekie", "tijger", "snuf",
"woezel", "pip", "puck", "nugget"];
const post_names = ["the destroyer", "the great", "the fool", "the conqueror",
"of death", "doom", "the insane", "the indestructable", "the wicked",
"the brutal", "frost", "the foul", "the pirate"];
const pre_names = ["super", "mad ", "mega", "ultra", "hyper", "power", "giga",
"insane ", "bad ", "zombie ", "robot ", "ninja ", "pirate ",
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
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('#game_canvas')
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
  // bullets are not initialized so any bullets flying when the player joins
  // are not visible. but maybe hit the player?
  world = new World(w);
  time = world.now();
  console.log("p", p);
  player = Player.from_obj(p);
  player.hit_list = world.walls;
  player.color = p.color;
  ready = true;
}

function on_server_update(player_update, new_bullets, bullet_hits) {
  // update the players except if it's the player then use the player with the energy update
  world.players = players.map(o => (o.id == player.id) ? player.energy = o.energy, player : Player.from_obj(o));
  for (let b of new_bullets) {
    if (b.author != player.id) world.bullets.push(Bullet.from_obj(b));
  }
  for (let bh of bullet_hits) {
    for (let i = world.bullets.length - 1; i >= 0; i--) {
      if (world.bullets[i].id == bh.id) world.bullets[i].hit_obj(bh.target);
    }
  }
}

let screenshake = 0, screen_shake_size = 4;
let next_update_time = 0;
function draw() {
  background("#123");
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
  screen_rect = new Rect(player.mx - W2, player.my - H2, W, H);
  if (screenshake > 0) {
    screenshake--;
    translate(random(-1, 1) * screen_shake_size, random(-1, 1) * screen_shake_size);
  }
  for (let wall of world.walls) {
    if (wall.hit(screen_rect)) wall.show();
  }
  for (let p of world.players) {
    if (p.hit(screen_rect)) (p.id == player.id ? player : p).show();
  }
  for (let i = world.bullets.length - 1; i >= 0; i--) {
    world.bullets[i].update();
    world.bullets[i].show();
  }
  do_particles(dt);
  pop();

  if (time > next_update_time) {
    socket.emit('player_update', player);
    next_update_time = time + 100; // upadet every 100ms
  }

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
  } else if (key == ' ' || key == 'j') {
    let dx = player.dx, dy = player.dy;
    let x = player.mx + dx * player.w / 2;
    let y = player.my + dy * player.h / 2;
    const bullet_cost = (key == ' ') ? 4 : 0; // 'b' is cheat free bullet
    if (player.energy > bullet_cost) {
      player.energy -= bullet_cost;
      let bullet_power = 17 - 0.1 * player.energy;
      let b = new Bullet(x, y, dx, dy, player.id);
      socket.emit('bullet_new', b);
      world.bullets.push(b);
      shootSound.play();
      fx_shoot(x, y, dx, dy);
    }
  } else if (key == 'x') {
      player.energy = max(0, player.energy - random(10,30));
  }
}
