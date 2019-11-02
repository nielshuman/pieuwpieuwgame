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

let canvas;
let zoom = 1, vertical_view = 960;
function setup() {
  // frameRate(30);
  canvas = createCanvas(windowWidth, windowHeight);
  zoom = windowHeight / vertical_view;
  canvas.parent('#game_canvas')
  socket = io();
  socket.on('server_update', on_server_update);
  socket.on('server_welcome', on_server_welcome);
  socket.on('damage', on_damage);
  socket.emit('player_join');
  username_box = select("#username");
  username_box.value((random() < 0.5) ? random(names) + ' ' + random(post_names) : random(pre_names) + random(names));
  masterVolume(0);
}

function on_damage(amount) {
  player.energy = max(0, player.energy - amount);
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

  let item = new Item(20, 20, 'size', '#66FF66'); // test item
  world.items = [item];


}

function on_server_update(players, new_bullets, bullet_hits) {
  if (!ready) return;
  // update the players except if it's the player then use the player with the energy update
  world.players = players.map(o => (o.id == player.id) ? player : Player.from_obj(o));
  for (let b of new_bullets) {
    if (b.author != player.id) world.bullets.push(Bullet.from_obj(b));
  }
  for (let bh of bullet_hits) {
    let b = bh.b, target = bh.target;
    for (let i = world.bullets.length - 1; i >= 0; i--) {
      if (world.bullets[i].id == b.id && b.author != player.id) {
        console.log("bullet_hit_event", bullet_hits);
        world.bullets[i].hit_obj(target);
      }
    }
  }
}

let screenshake = 0, screen_shake_size = 4;
let next_update_time = 0;

function draw() {
  background(player && player.energy <= 0 ? "#311" : "#123");
  if (!ready) {return};

  let prev_time = time;
  time = world.now();
  dt = time - prev_time;
  // controls and movement
  let speed = 0.42 * dt;
  if (keyIsDown(87 /*W*/) || keyIsDown(UP_ARROW))    player.move(0, -speed); 
  if (keyIsDown(83 /*S*/) || keyIsDown(DOWN_ARROW))  player.move(0, speed);
  if (keyIsDown(65 /*A*/) || keyIsDown(LEFT_ARROW))  player.move(-speed, 0);
  if (keyIsDown(68 /*D*/) || keyIsDown(RIGHT_ARROW)) player.move(speed, 0);

  // rendering world
  push();
  scale(zoom);
  translate(width / 2 / zoom - player.mx, height / 2 / zoom - player.my);
  screen_rect = new Rect(player.mx - width / 2 / zoom, player.my - height / 2 / zoom, width / zoom, height / zoom);
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
    /* PROBLEEM: Bullet hit wall, wordt geremoved, kan dus niet meer showen
       FIX: Omdraaien, maar dus wel 1 frame achter
    */
    if i.hit(screen_rect) world.bullets[i].show();
    world.bullets[i].update();
  }
  for (let i of world.items) {
    if i.hit(screen_rect) i.show();
    if (player.hit(i)){
      player.useItem(i);
      i.remove();
      // server vertellen dat item weg is
    } 
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
      let b = new Bullet(x, y, dx, dy, bullet_power, player.id);
      socket.emit('bullet_new', b);
      world.bullets.push(b);
      shootSound.play();
      fx_shoot(x, y, dx, dy);
    }
  } else if (key == 'x') {
      player.energy = max(0, player.energy - random(10,30));
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  zoom = windowHeight / vertical_view;
}
